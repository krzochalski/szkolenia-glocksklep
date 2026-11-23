import type { Firestore } from 'firebase-admin/firestore';
import { z } from 'zod';

import { coursePageUrl, isProformaEmailEnabled } from '../mail';
import {
	baseProformaNumber,
	buildProforma,
	bruttoFromNetto,
	effectiveEnrollmentNetto,
	FALLBACK_BILLING,
	type ProformaBillingInput,
	type ProformaCourseKind,
	roundMoney,
	shouldSkipProforma,
	withProformaVersion,
} from './build';
import type { ParticipantProformaState } from './claim';
import {
	computeManualPrice,
	type ManualPriceAdjustmentType,
} from './computeManualPrice';
import { sendUpdatedProformaMail } from './mail';
import { renderProformaPdf } from './pdf';

const HISTORY_CAP = 20;
const VERSIONS_CAP = 20;

export const adjustParticipantPriceBodySchema = z
	.object({
		courseId: z.string().min(1),
		dateId: z.string().min(1),
		participantId: z.string().min(1),
		priceChangeId: z.string().uuid(),
		adjustment: z
			.object({
				type: z.enum(['finalPrice', 'percent', 'fixed']),
				value: z.number().finite(),
			})
			.nullable(),
		reason: z.string().trim().max(500).optional(),
		note: z.string().trim().max(2000).optional(),
		confirmPaidAdjustment: z.boolean().optional(),
	})
	.superRefine((body, ctx) => {
		if (body.adjustment != null) {
			const reason = body.reason?.trim() ?? '';
			if (!reason) {
				ctx.addIssue({
					code: 'custom',
					path: ['reason'],
					message: 'Podaj powód widoczny dla uczestnika.',
				});
			}
		}
	});

export type AdjustParticipantPriceBody = z.infer<typeof adjustParticipantPriceBodySchema>;

type ParticipantDoc = {
	id?: string;
	name?: string;
	email?: string;
	phoneNumber?: string;
	paid?: boolean;
	paysByCash?: boolean;
	customPrice?: number;
	customPriceNote?: string;
	customPriceUpdatedAt?: string;
	customPriceUpdatedBy?: string;
	priceSnapshot?: Record<string, unknown>;
	priceHistory?: Array<Record<string, unknown>>;
	proforma?: ParticipantProformaState;
	proformaVersions?: ParticipantProformaState[];
};

type CourseDate = {
	id?: string;
	date?: string;
	timeStart?: string;
	customPrice?: number;
	canceled?: boolean;
	participants?: ParticipantDoc[];
};

type CourseDoc = {
	name?: string;
	slug?: string;
	price?: number;
	kind?: string;
	instructor?: { id?: string };
	dates?: CourseDate[];
};

type UserDoc = {
	nip?: string;
	displayName?: string;
	fullName?: string;
	phoneNumber?: string;
	email?: string;
};

type PriceChangeDoc = {
	dateId: string;
	participantId: string;
	status: 'pending' | 'done' | 'failed';
	createdAt: string;
	updatedAt?: string;
	adminUid: string;
	result?: AdjustParticipantPriceResult;
	error?: string;
};

export type AdjustParticipantPriceResult = {
	ok: true;
	status: 'applied' | 'idempotent' | 'skipped_proforma';
	priceChangeId: string;
	oldFinalPrice: number;
	newFinalPrice: number;
	proformaNumber?: string;
	proformaSkipped?: boolean;
};

export type AdjustParticipantPriceError = {
	ok: false;
	code:
		| 'not_found'
		| 'paid_confirm_required'
		| 'validation'
		| 'forbidden'
		| 'proforma_failed';
	error: string;
};

const matchDate = (d: CourseDate, dateId: string): boolean =>
	d.id === dateId || d.date === dateId;

const asBilling = (data: Record<string, unknown> | undefined): ProformaBillingInput => {
	if (!data) return { ...FALLBACK_BILLING };
	const vatRate =
		typeof data.vatRate === 'number' && data.vatRate > 0 ? data.vatRate : 23;
	return {
		name: typeof data.name === 'string' && data.name.trim() ? data.name : FALLBACK_BILLING.name,
		address:
			typeof data.address === 'string' && data.address.trim()
				? data.address
				: FALLBACK_BILLING.address,
		city: typeof data.city === 'string' && data.city.trim() ? data.city : FALLBACK_BILLING.city,
		nip: typeof data.nip === 'string' && data.nip.trim() ? data.nip : FALLBACK_BILLING.nip,
		website: typeof data.website === 'string' ? data.website : FALLBACK_BILLING.website,
		phone: typeof data.phone === 'string' ? data.phone : FALLBACK_BILLING.phone,
		bankName:
			typeof data.bankName === 'string' && data.bankName.trim()
				? data.bankName
				: FALLBACK_BILLING.bankName,
		bankAccount:
			typeof data.bankAccount === 'string' && data.bankAccount.trim()
				? data.bankAccount
				: FALLBACK_BILLING.bankAccount,
		paymentMethod:
			typeof data.paymentMethod === 'string' && data.paymentMethod.trim()
				? data.paymentMethod
				: FALLBACK_BILLING.paymentMethod,
		issuePlace:
			typeof data.issuePlace === 'string' && data.issuePlace.trim()
				? data.issuePlace
				: FALLBACK_BILLING.issuePlace,
		vatRate,
	};
};

const loadBilling = async (
	db: Firestore,
	instructorId: string | undefined
): Promise<ProformaBillingInput> => {
	if (!instructorId) return { ...FALLBACK_BILLING };
	const snap = await db
		.collection('billingData')
		.where('instructorId', '==', instructorId)
		.limit(1)
		.get();
	if (snap.empty) return { ...FALLBACK_BILLING };
	return asBilling(snap.docs[0].data() as Record<string, unknown>);
};

const stripUndefined = <T extends Record<string, unknown>>(obj: T): T => {
	const out: Record<string, unknown> = {};
	for (const [k, v] of Object.entries(obj)) {
		if (v !== undefined) out[k] = v;
	}
	return out as T;
};

const capTail = <T>(arr: T[], max: number): T[] =>
	arr.length <= max ? arr : arr.slice(arr.length - max);

/**
 * Admin-only: set/clear manual price, audit, issue replacement proforma + e-mail.
 * Idempotent on `priceChangeId` (courses/{id}/priceChanges/{priceChangeId}).
 */
export const adjustParticipantPrice = async (params: {
	db: Firestore;
	adminUid: string;
	body: AdjustParticipantPriceBody;
}): Promise<AdjustParticipantPriceResult | AdjustParticipantPriceError> => {
	const { db, adminUid, body } = params;
	const changeRef = db
		.collection('courses')
		.doc(body.courseId)
		.collection('priceChanges')
		.doc(body.priceChangeId);

	const existingChange = await changeRef.get();
	if (existingChange.exists) {
		const data = existingChange.data() as PriceChangeDoc;
		if (data.status === 'done' && data.result) {
			return { ...data.result, status: 'idempotent' };
		}
		if (data.status === 'pending') {
			return {
				ok: false,
				code: 'validation',
				error: 'Ta zmiana ceny jest już w toku. Poczekaj chwilę.',
			};
		}
	}

	const courseRef = db.collection('courses').doc(body.courseId);
	const courseSnap = await courseRef.get();
	if (!courseSnap.exists) {
		return { ok: false, code: 'not_found', error: 'Kurs nie istnieje.' };
	}
	const course = courseSnap.data() as CourseDoc;
	const date = (course.dates ?? []).find((d) => matchDate(d, body.dateId));
	if (!date?.date) {
		return { ok: false, code: 'not_found', error: 'Termin nie istnieje.' };
	}
	const participant = (date.participants ?? []).find((p) => p.id === body.participantId);
	if (!participant) {
		return { ok: false, code: 'not_found', error: 'Uczestnik nie jest zapisany.' };
	}

	const basePrice = roundMoney(
		typeof date.customPrice === 'number'
			? date.customPrice
			: typeof course.price === 'number'
				? course.price
				: 0
	);
	const oldFinalPrice = effectiveEnrollmentNetto(
		typeof course.price === 'number' ? course.price : 0,
		date.customPrice,
		participant.customPrice
	);

	let computed: { finalPrice: number; discountTotal: number };
	try {
		computed = computeManualPrice(basePrice, body.adjustment);
	} catch (err) {
		return {
			ok: false,
			code: 'validation',
			error: err instanceof Error ? err.message : 'Nieprawidłowa korekta ceny.',
		};
	}

	const newFinalPrice = computed.finalPrice;
	const priceChanged = roundMoney(oldFinalPrice) !== newFinalPrice;

	if (participant.paid === true && priceChanged && body.confirmPaidAdjustment !== true) {
		return {
			ok: false,
			code: 'paid_confirm_required',
			error:
				'Uczestnik ma już oznaczenie „opłacone”. Potwierdź świadomie zmianę ceny (brak automatycznych zwrotów — rozliczenie nadpłaty ręcznie).',
		};
	}

	const now = new Date().toISOString();
	const reason =
		body.adjustment == null
			? 'Przywrócenie ceny z listy'
			: (body.reason?.trim() ?? '');
	const note = body.note?.trim() || undefined;
	const adjustmentType: ManualPriceAdjustmentType =
		body.adjustment?.type ?? 'finalPrice';
	const adjustmentValue = body.adjustment?.value ?? newFinalPrice;

	const priceSnapshot = stripUndefined({
		basePrice,
		automaticDiscount: 0,
		...(body.adjustment
			? {
					manualAdjustment: stripUndefined({
						type: body.adjustment.type,
						value: body.adjustment.value,
						reason,
						note,
						adjustedBy: adminUid,
						adjustedAt: now,
					}),
				}
			: {}),
		discountTotal: computed.discountTotal,
		finalPrice: newFinalPrice,
	});

	const historyEntry = stripUndefined({
		id: body.priceChangeId,
		oldFinalPrice,
		newFinalPrice,
		reason,
		adjustedBy: adminUid,
		adjustedAt: now,
		type: adjustmentType,
		value: adjustmentValue,
	});

	const prevVersions = [...(participant.proformaVersions ?? [])];
	const currentProforma = participant.proforma;
	const skipProforma =
		!isProformaEmailEnabled() ||
		shouldSkipProforma({
			amountNet: newFinalPrice,
			paysByCash: participant.paysByCash,
		}) ||
		!participant.email?.trim();

	let nextVersion = 1;
	let previousProformaNumber: string | undefined;
	let nextProformaPending: ParticipantProformaState | undefined;
	const nextVersions = [...prevVersions];

	if (!skipProforma && priceChanged) {
		if (currentProforma && currentProforma.status !== 'replaced') {
			previousProformaNumber = currentProforma.number;
			nextVersions.push({
				...currentProforma,
				status: 'replaced',
				replacedAt: now,
			});
			nextVersion = Math.max(1, (currentProforma.version ?? 1) + 1);
		} else if (currentProforma?.version) {
			nextVersion = currentProforma.version + 1;
		} else if (prevVersions.length > 0) {
			const last = prevVersions[prevVersions.length - 1];
			nextVersion = Math.max(1, (last.version ?? 1) + 1);
		}

		const baseNumber = withProformaVersion(
			baseProformaNumber(
				currentProforma?.number?.trim() ||
					prevVersions[prevVersions.length - 1]?.number ||
					''
			) || 'PF/PENDING',
			1
		);
		// Number finalized after buildProforma (buyer initials); placeholder until then.
		nextProformaPending = {
			status: 'pending',
			number: withProformaVersion(baseNumber, nextVersion),
			amountNet: newFinalPrice,
			amountGross: bruttoFromNetto(newFinalPrice, 23),
			vatRate: 23,
			dueDate: '',
			paymentTitle: '',
			version: nextVersion,
			priceChangeId: body.priceChangeId,
		};
	}

	await changeRef.set({
		dateId: body.dateId,
		participantId: body.participantId,
		status: 'pending',
		createdAt: now,
		adminUid,
	} satisfies Omit<PriceChangeDoc, 'result' | 'error' | 'updatedAt'>);

	await db.runTransaction(async (tx) => {
		const snap = await tx.get(courseRef);
		if (!snap.exists) throw new Error('Kurs nie istnieje.');
		const fresh = snap.data() as CourseDoc;
		const dates = (fresh.dates ?? []).map((d) => {
			if (!matchDate(d, body.dateId)) return d;
			return {
				...d,
				participants: (d.participants ?? []).map((p) => {
					if (p.id !== body.participantId) return p;
					const next: ParticipantDoc = {
						...p,
						customPriceUpdatedAt: now,
						customPriceUpdatedBy: adminUid,
						priceSnapshot,
						priceHistory: capTail(
							[...(p.priceHistory ?? []), historyEntry],
							HISTORY_CAP
						),
					};
					if (body.adjustment == null) {
						delete next.customPrice;
						delete next.customPriceNote;
						delete next.priceSnapshot;
						next.priceSnapshot = {
							basePrice,
							automaticDiscount: 0,
							discountTotal: 0,
							finalPrice: newFinalPrice,
						};
					} else {
						next.customPrice = newFinalPrice;
						next.customPriceNote = reason;
					}
					if (nextProformaPending) {
						next.proformaVersions = capTail(nextVersions, VERSIONS_CAP);
						next.proforma = nextProformaPending;
					}
					return next;
				}),
			};
		});
		tx.update(courseRef, { dates });
	});

	if (skipProforma || !priceChanged) {
		const result: AdjustParticipantPriceResult = {
			ok: true,
			status: skipProforma && priceChanged ? 'skipped_proforma' : 'applied',
			priceChangeId: body.priceChangeId,
			oldFinalPrice,
			newFinalPrice,
			proformaSkipped: skipProforma || !priceChanged,
		};
		await changeRef.set(
			{
				status: 'done',
				updatedAt: new Date().toISOString(),
				result,
			},
			{ merge: true }
		);
		return result;
	}

	try {
		const userSnap = await db.collection('users').doc(body.participantId).get();
		const user = (userSnap.exists ? userSnap.data() : {}) as UserDoc;
		const billing = await loadBilling(db, course.instructor?.id);
		const kind: ProformaCourseKind =
			course.kind === 'practice' ? 'practice' : 'course';

		const buyer = {
			displayName:
				participant.name?.trim() ||
				user.fullName?.trim() ||
				user.displayName?.trim() ||
				undefined,
			email: participant.email!.trim(),
			phone: participant.phoneNumber ?? user.phoneNumber,
			nip: user.nip?.trim() || undefined,
		};

		const baseNumSource =
			previousProformaNumber ||
			currentProforma?.number ||
			'';
		const generatedBase = baseProformaNumber(baseNumSource);

		const invoiceDraft = buildProforma({
			kind,
			courseName: course.name?.trim() || 'Szkolenie',
			courseSlug: course.slug,
			courseId: body.courseId,
			dateId: body.dateId,
			participantId: body.participantId,
			classDateYmd: date.date,
			classTimeStart: date.timeStart,
			amountNet: newFinalPrice,
			billing,
			buyer,
			existingNumber: generatedBase || undefined,
			baseAmountNet: basePrice,
			discountTotal: computed.discountTotal,
			discountReason: reason,
		});

		const versionedNumber = withProformaVersion(invoiceDraft.number, nextVersion);
		const invoice = buildProforma({
			kind,
			courseName: course.name?.trim() || 'Szkolenie',
			courseSlug: course.slug,
			courseId: body.courseId,
			dateId: body.dateId,
			participantId: body.participantId,
			classDateYmd: date.date,
			classTimeStart: date.timeStart,
			amountNet: newFinalPrice,
			billing,
			buyer,
			existingNumber: versionedNumber,
			baseAmountNet: basePrice,
			discountTotal: computed.discountTotal,
			discountReason: reason,
		});

		const pdf = await renderProformaPdf(invoice);
		const alreadyPaidOverNew =
			participant.paid === true && newFinalPrice < oldFinalPrice;

		const mailResult = await sendUpdatedProformaMail({
			to: participant.email!.trim(),
			invoice,
			pdf,
			courseUrl: coursePageUrl(course.slug?.trim() || body.courseId),
			courseName: course.name?.trim() || 'Szkolenie',
			classDateYmd: date.date,
			oldAmountNet: oldFinalPrice,
			newAmountNet: newFinalPrice,
			reason,
			alreadyPaidOverNew,
			previousProformaNumber,
		});

		const sentState: ParticipantProformaState = stripUndefined({
			status: mailResult.sent ? 'sent' : 'failed',
			number: invoice.number,
			amountNet: invoice.amountNet,
			amountGross: invoice.amountGross,
			vatRate: invoice.vatRate,
			dueDate: invoice.dueDate,
			paymentTitle: invoice.paymentTitle,
			version: nextVersion,
			priceChangeId: body.priceChangeId,
			sentAt: mailResult.sent ? new Date().toISOString() : undefined,
			error: mailResult.sent ? undefined : (mailResult.reason ?? 'smtp_failed'),
		}) as ParticipantProformaState;

		await db.runTransaction(async (tx) => {
			const snap = await tx.get(courseRef);
			if (!snap.exists) return;
			const fresh = snap.data() as CourseDoc;
			const dates = (fresh.dates ?? []).map((d) => {
				if (!matchDate(d, body.dateId)) return d;
				return {
					...d,
					participants: (d.participants ?? []).map((p) =>
						p.id === body.participantId ? { ...p, proforma: sentState } : p
					),
				};
			});
			tx.update(courseRef, { dates });
		});

		if (!mailResult.sent) {
			await changeRef.set(
				{
					status: 'failed',
					updatedAt: new Date().toISOString(),
					error: sentState.error ?? 'smtp_failed',
				},
				{ merge: true }
			);
			return {
				ok: false,
				code: 'proforma_failed',
				error: sentState.error ?? 'Nie udało się wysłać e-maila z proformą.',
			};
		}

		const result: AdjustParticipantPriceResult = {
			ok: true,
			status: 'applied',
			priceChangeId: body.priceChangeId,
			oldFinalPrice,
			newFinalPrice,
			proformaNumber: invoice.number,
		};
		await changeRef.set(
			{
				status: 'done',
				updatedAt: new Date().toISOString(),
				result,
			},
			{ merge: true }
		);
		return result;
	} catch (err) {
		const message = err instanceof Error ? err.message : 'proforma_failed';
		console.error('adjustParticipantPrice proforma failed', err);
		await changeRef.set(
			{
				status: 'failed',
				updatedAt: new Date().toISOString(),
				error: message,
			},
			{ merge: true }
		);
		return { ok: false, code: 'proforma_failed', error: message };
	}
};
