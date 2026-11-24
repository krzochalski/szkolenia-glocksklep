import type { Firestore } from 'firebase-admin/firestore';

import { coursePageUrl, isProformaEmailEnabled } from '../mail';
import { loadBilling } from './billing';
import {
	buildProforma,
	effectiveEnrollmentNetto,
	type ProformaCourseKind,
	shouldSkipProforma,
} from './build';
import {
	claimProformaInTx,
	type ParticipantProformaState,
	updateParticipantProforma,
} from './claim';
import { resolveProformaBuyer, type SalesDocumentType } from '../salesDocument';
import { sendProformaMail } from './mail';
import { renderProformaPdf } from './pdf';

type CourseDate = {
	id?: string;
	date?: string;
	timeStart?: string;
	customPrice?: number;
	canceled?: boolean;
	participants?: Array<{
		id?: string;
		name?: string;
		email?: string;
		phoneNumber?: string;
		paysByCash?: boolean;
		customPrice?: number;
		proforma?: ParticipantProformaState;
		documentType?: SalesDocumentType;
		invoiceNip?: string;
		invoiceCompanyName?: string;
		invoiceCompanyAddress?: string;
	}>;
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

const matchDate = (d: CourseDate, dateId: string): boolean =>
	d.id === dateId || d.date === dateId;

export type SendEnrollmentProformaParams = {
	db: Firestore;
	courseId: string;
	dateId: string;
	participantId: string;
	/** When true (admin resend): remmail existing sent PDF or recreate after failed. */
	forceResend?: boolean;
};

export type SendEnrollmentProformaResult =
	| { ok: true; status: 'sent' | 'skipped'; reason?: string; number?: string }
	| { ok: false; status: 'failed'; error: string };

/**
 * Best-effort auto proforma after enroll. Never throws; failures mark participant.proforma.
 * Does not roll back enrollment.
 */
export const sendEnrollmentProforma = async (
	params: SendEnrollmentProformaParams
): Promise<SendEnrollmentProformaResult> => {
	const forceResend = params.forceResend === true;

	if (!isProformaEmailEnabled()) {
		return { ok: true, status: 'skipped', reason: 'disabled' };
	}

	try {
		const courseSnap = await params.db.collection('courses').doc(params.courseId).get();
		if (!courseSnap.exists) {
			return { ok: true, status: 'skipped', reason: 'course_missing' };
		}
		const course = courseSnap.data() as CourseDoc;
		const date = (course.dates ?? []).find((d) => matchDate(d, params.dateId));
		if (!date?.date) {
			return { ok: true, status: 'skipped', reason: 'date_missing' };
		}
		const participant = (date.participants ?? []).find((p) => p.id === params.participantId);
		if (!participant?.email?.trim()) {
			return { ok: true, status: 'skipped', reason: 'participant_missing' };
		}

		const amountNet = effectiveEnrollmentNetto(
			typeof course.price === 'number' ? course.price : 0,
			date.customPrice,
			participant.customPrice
		);

		if (
			shouldSkipProforma({
				amountNet,
				paysByCash: participant.paysByCash,
			})
		) {
			return { ok: true, status: 'skipped', reason: 'free_or_cash' };
		}

		const userSnap = await params.db.collection('users').doc(params.participantId).get();
		const user = (userSnap.exists ? userSnap.data() : {}) as UserDoc;

		const billing = await loadBilling(params.db, course.instructor?.id);
		const kind: ProformaCourseKind =
			course.kind === 'practice' ? 'practice' : 'course';

		const buyer = resolveProformaBuyer(participant, user);
		const documentType = participant.documentType ?? (buyer.nip ? 'invoice' : 'receipt');

		const invoice = buildProforma({
			kind,
			courseName: course.name?.trim() || 'Szkolenie',
			courseSlug: course.slug,
			courseId: params.courseId,
			dateId: params.dateId,
			participantId: params.participantId,
			classDateYmd: date.date,
			classTimeStart: date.timeStart,
			amountNet,
			billing,
			buyer: {
				...buyer,
				email: participant.email.trim(),
				phone: participant.phoneNumber ?? user.phoneNumber,
			},
			existingNumber: participant.proforma?.number,
		});

		const nextState: ParticipantProformaState = {
			status: 'pending',
			number: invoice.number,
			amountNet: invoice.amountNet,
			amountGross: invoice.amountGross,
			vatRate: invoice.vatRate,
			dueDate: invoice.dueDate,
			paymentTitle: invoice.paymentTitle,
			version: participant.proforma?.version ?? 1,
		};

		const claim = await claimProformaInTx(params.db, {
			courseId: params.courseId,
			dateId: params.dateId,
			participantId: params.participantId,
			forceResend,
			nextState,
		});

		if (claim.action === 'skip') {
			return { ok: true, status: 'skipped', reason: claim.reason };
		}

		const activeInvoice =
			claim.action === 'resend'
				? buildProforma({
						kind,
						courseName: course.name?.trim() || 'Szkolenie',
						courseSlug: course.slug,
						courseId: params.courseId,
						dateId: params.dateId,
						participantId: params.participantId,
						classDateYmd: date.date,
						classTimeStart: date.timeStart,
						amountNet: claim.state.amountNet,
						billing,
						buyer: {
							...resolveProformaBuyer(participant, user),
							email: participant.email.trim(),
							phone: participant.phoneNumber ?? user.phoneNumber,
						},
						existingNumber: claim.state.number,
					})
				: invoice;

		const pdf = await renderProformaPdf(activeInvoice);
		const slug = course.slug?.trim() || params.courseId;
		const mailResult = await sendProformaMail({
			to: participant.email.trim(),
			invoice: activeInvoice,
			pdf,
			courseUrl: coursePageUrl(slug),
			documentType,
		});

		if (!mailResult.sent) {
			const failed: ParticipantProformaState = {
				...activeInvoiceState(activeInvoice),
				status: 'failed',
				error: mailResult.reason ?? 'smtp_failed',
			};
			await updateParticipantProforma(params.db, {
				courseId: params.courseId,
				dateId: params.dateId,
				participantId: params.participantId,
				proforma: failed,
			});
			return { ok: false, status: 'failed', error: failed.error ?? 'smtp_failed' };
		}

		const sent: ParticipantProformaState = {
			...activeInvoiceState(activeInvoice),
			status: 'sent',
			sentAt: new Date().toISOString(),
		};
		await updateParticipantProforma(params.db, {
			courseId: params.courseId,
			dateId: params.dateId,
			participantId: params.participantId,
			proforma: sent,
		});
		return { ok: true, status: 'sent', number: sent.number };
	} catch (err) {
		const message = err instanceof Error ? err.message : 'proforma_failed';
		console.error('Enrollment proforma failed', err);
		try {
			await updateParticipantProforma(params.db, {
				courseId: params.courseId,
				dateId: params.dateId,
				participantId: params.participantId,
				proforma: {
					status: 'failed',
					number: '—',
					amountNet: 0,
					amountGross: 0,
					vatRate: 23,
					dueDate: '',
					paymentTitle: '',
					error: message,
				},
			});
		} catch (updateErr) {
			console.error('Failed to persist proforma failure state', updateErr);
		}
		return { ok: false, status: 'failed', error: message };
	}
};

const activeInvoiceState = (
	invoice: ReturnType<typeof buildProforma>
): Omit<ParticipantProformaState, 'status' | 'sentAt' | 'error'> => ({
	number: invoice.number,
	amountNet: invoice.amountNet,
	amountGross: invoice.amountGross,
	vatRate: invoice.vatRate,
	dueDate: invoice.dueDate,
	paymentTitle: invoice.paymentTitle,
});
