/**
 * Fakturownia paragon integration for course registrations (SZ-18).
 * Core API flow adapted from stayfrosty `functions/src/fakturownia.ts` (shop orders).
 */

import type { Auth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';
import type { Request } from 'express';

import {
	effectiveEnrollmentNetto,
	FALLBACK_BILLING,
	formatProformaServiceName,
	type ProformaBillingInput,
	type ProformaCourseKind,
	shouldSkipProforma,
} from '../proforma/build';
import { asBilling, loadBilling } from '../proforma/billing';
import { resolveProformaBuyer } from '../salesDocument';
import {
	buildRegistrationReceiptPositions,
	type FakturowniaPosition,
	registrationReceiptOid,
} from './receiptPositions';

export type FakturowniaReceiptRef = {
	receiptId: number;
	number: string | null;
	viewUrl: string | null;
	createdAt: string;
};

export type FakturowniaInvoicePayload = {
	kind: 'receipt';
	number: null;
	sell_date: string;
	issue_date: string;
	oid: string;
	seller_name: string;
	seller_tax_no: string;
	buyer_name: string;
	buyer_email: string;
	buyer_tax_no?: string;
	positions: FakturowniaPosition[];
};

export type CreateReceiptResult =
	| { alreadyExists: true; receipt: FakturowniaReceiptRef }
	| { alreadyExists: false; receipt: FakturowniaReceiptRef };

export class AdminAuthError extends Error {
	readonly status: number;

	constructor(message: string, status: number) {
		super(message);
		this.name = 'AdminAuthError';
		this.status = status;
	}
}

export class FakturowniaConfigError extends Error {
	readonly status = 503;

	constructor(message: string) {
		super(message);
		this.name = 'FakturowniaConfigError';
	}
}

export class FakturowniaApiError extends Error {
	readonly status: number;
	readonly details: unknown;

	constructor(message: string, status: number, details?: unknown) {
		super(message);
		this.name = 'FakturowniaApiError';
		this.status = status;
		this.details = details;
	}
}

export class RegistrationNotFoundError extends Error {
	readonly status = 404;

	constructor(message: string) {
		super(message);
		this.name = 'RegistrationNotFoundError';
	}
}

export class ReceiptIssuingConflictError extends Error {
	readonly status = 409;

	constructor(message: string) {
		super(message);
		this.name = 'ReceiptIssuingConflictError';
	}
}

/** Active issuing locks older than this may be reclaimed (stale admin tab / crash). */
const ISSUING_LOCK_STALE_MS = 5 * 60 * 1000;

/** Calendar date in Europe/Warsaw as YYYY-MM-DD. */
export const warsawDateString = (date: Date = new Date()): string =>
	new Intl.DateTimeFormat('en-CA', {
		timeZone: 'Europe/Warsaw',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).format(date);

export const buildReceiptViewUrl = (domain: string, token: string): string =>
	`https://${domain}.fakturownia.pl/invoice/${token}`;

export const parseStoredReceipt = (raw: unknown): FakturowniaReceiptRef | null => {
	if (!raw || typeof raw !== 'object') return null;
	const data = raw as Record<string, unknown>;
	if (data.status === 'issuing') return null;
	const receiptId = Number(data.receiptId);
	if (!Number.isFinite(receiptId) || receiptId <= 0) return null;
	return {
		receiptId,
		number: data.number == null ? null : String(data.number),
		viewUrl: data.viewUrl == null ? null : String(data.viewUrl),
		createdAt: data.createdAt == null ? new Date().toISOString() : String(data.createdAt),
	};
};

const isActiveIssuingLock = (raw: unknown): boolean => {
	if (!raw || typeof raw !== 'object') return false;
	const data = raw as Record<string, unknown>;
	if (data.status !== 'issuing') return false;
	if (parseStoredReceipt(raw)) return false;
	const at = data.issuingAt == null ? NaN : Date.parse(String(data.issuingAt));
	if (!Number.isFinite(at)) return true;
	return Date.now() - at < ISSUING_LOCK_STALE_MS;
};

const getFakturowniaConfig = (): { domain: string; apiToken: string } => {
	const domain = process.env.FAKTUROWNIA_DOMAIN?.trim();
	const apiToken = process.env.FAKTUROWNIA_API_TOKEN?.trim();
	if (!domain || !apiToken) {
		throw new FakturowniaConfigError(
			'Fakturownia nie skonfigurowana (FAKTUROWNIA_DOMAIN / FAKTUROWNIA_API_TOKEN)'
		);
	}
	return { domain, apiToken };
};

/** Prefer X-Firebase-Authorization when App Hosting proxies with a Google ID token in Authorization. */
const firebaseBearerFromHeaders = (headers: Request['headers']): string | null => {
	const raw = headers['x-firebase-authorization'] ?? headers.authorization ?? '';
	const header = Array.isArray(raw) ? raw[0] : raw;
	if (typeof header !== 'string') return null;
	const match = /^Bearer\s+(.+)$/i.exec(header);
	return match?.[1]?.trim() || null;
};

export const requireAdmin = async (
	req: Pick<Request, 'headers'>,
	auth: Auth,
	db: Firestore
): Promise<{ uid: string; email: string | undefined }> => {
	const token = firebaseBearerFromHeaders(req.headers);
	if (!token) {
		throw new AdminAuthError('Missing bearer token', 401);
	}
	let decoded: { uid: string; email?: string };
	try {
		decoded = await auth.verifyIdToken(token);
	} catch {
		throw new AdminAuthError('Invalid token', 401);
	}
	const adminSnap = await db.doc(`admins/${decoded.uid}`).get();
	if (!adminSnap.exists) {
		throw new AdminAuthError('Forbidden', 403);
	}
	return { uid: decoded.uid, email: decoded.email };
};

const postFakturowniaReceipt = async (
	domain: string,
	apiToken: string,
	invoice: FakturowniaInvoicePayload,
	fetchImpl: typeof fetch
): Promise<{ id: number; number: string | null; token: string | null }> => {
	const url = `https://${domain}.fakturownia.pl/invoices.json`;
	const res = await fetchImpl(url, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiToken}`,
			Accept: 'application/json',
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ invoice }),
	});
	const text = await res.text();
	let body: unknown = null;
	if (text.trim()) {
		try {
			body = JSON.parse(text) as unknown;
		} catch {
			body = text;
		}
	}
	if (!res.ok) {
		throw new FakturowniaApiError(
			`Fakturownia HTTP ${res.status}`,
			res.status >= 400 && res.status < 600 ? res.status : 502,
			body
		);
	}
	if (!body || typeof body !== 'object') {
		throw new FakturowniaApiError('Fakturownia: pusta odpowiedź', 502, body);
	}
	const data = body as Record<string, unknown>;
	const id = Number(data.id);
	if (!Number.isFinite(id) || id <= 0) {
		throw new FakturowniaApiError('Fakturownia: brak id paragonu', 502, body);
	}
	return {
		id,
		number: data.number == null ? null : String(data.number),
		token: data.token == null ? null : String(data.token),
	};
};

type CourseDate = {
	id?: string;
	date?: string;
	timeStart?: string;
	customPrice?: number;
	participants?: Array<Record<string, unknown>>;
};

type CourseDoc = {
	name?: string;
	slug?: string;
	price?: number;
	kind?: string;
	instructor?: { id?: string };
	dates?: CourseDate[];
};

const matchDate = (d: CourseDate, dateId: string): boolean =>
	d.id === dateId || d.date === dateId;

type UserDoc = {
	nip?: string;
	displayName?: string;
	fullName?: string;
	phoneNumber?: string;
	email?: string;
};

export type CreateReceiptForRegistrationParams = {
	courseId: string;
	dateId: string;
	participantId: string;
};

export const buildRegistrationReceiptPayload = (input: {
	oid: string;
	buyerName: string;
	buyerEmail: string;
	buyerNip?: string;
	seller: ProformaBillingInput;
	serviceLine: string;
	amountNet: number;
	baseAmountNet?: number;
	discountTotal?: number;
	discountReason?: string;
	issueDate?: string;
}): FakturowniaInvoicePayload => {
	const date = input.issueDate ?? warsawDateString();
	const vatRate =
		typeof process.env.FAKTUROWNIA_VAT_PERCENT === 'string' &&
		Number(process.env.FAKTUROWNIA_VAT_PERCENT) > 0
			? Number(process.env.FAKTUROWNIA_VAT_PERCENT)
			: input.seller.vatRate > 0
				? input.seller.vatRate
				: 23;
	const payload: FakturowniaInvoicePayload = {
		kind: 'receipt',
		number: null,
		sell_date: date,
		issue_date: date,
		oid: input.oid,
		seller_name: input.seller.name,
		seller_tax_no: input.seller.nip,
		buyer_name: input.buyerName,
		buyer_email: input.buyerEmail,
		positions: buildRegistrationReceiptPositions({
			serviceLine: input.serviceLine,
			amountNet: input.amountNet,
			baseAmountNet: input.baseAmountNet,
			discountTotal: input.discountTotal,
			discountReason: input.discountReason,
			vatRatePercent: vatRate,
		}),
	};
	const nip = input.buyerNip?.trim();
	if (nip) payload.buyer_tax_no = nip;
	return payload;
};

const validateReceiptParticipant = (
	course: CourseDoc,
	date: CourseDate,
	participant: Record<string, unknown>
): { amountNet: number } => {
	const documentType = participant.documentType;
	if (documentType === 'invoice') {
		throw new FakturowniaApiError('Ten zapis wymaga faktury VAT, nie paragonu.', 400);
	}
	if (participant.paid !== true) {
		throw new FakturowniaApiError('Uczestnik musi być oznaczony jako opłacony.', 400);
	}
	const amountNet = effectiveEnrollmentNetto(
		typeof course.price === 'number' ? course.price : 0,
		date.customPrice,
		typeof participant.customPrice === 'number' ? participant.customPrice : undefined
	);
	if (
		shouldSkipProforma({
			amountNet,
			paysByCash: participant.paysByCash === true,
		})
	) {
		throw new FakturowniaApiError('Brak kwoty do paragonu (gotówka lub 0 zł).', 400);
	}
	return { amountNet };
};

const patchParticipantOnDate = (
	course: CourseDoc,
	dateId: string,
	participantId: string,
	patch: (p: Record<string, unknown>) => Record<string, unknown>
): CourseDate[] =>
	(course.dates ?? []).map((d) => {
		if (!matchDate(d, dateId)) return d;
		const participants = (d.participants ?? []).map((p) =>
			p.id === participantId ? patch(p) : p
		);
		return { ...d, participants };
	});

export const createReceiptForRegistration = async (
	db: Firestore,
	params: CreateReceiptForRegistrationParams,
	fetchImpl: typeof fetch = fetch
): Promise<CreateReceiptResult> => {
	const courseRef = db.collection('courses').doc(params.courseId);

	type ClaimResult =
		| { kind: 'exists'; receipt: FakturowniaReceiptRef }
		| { kind: 'claimed'; course: CourseDoc; date: CourseDate; participant: Record<string, unknown> };

	const claimed = await db.runTransaction(async (tx): Promise<ClaimResult> => {
		const snap = await tx.get(courseRef);
		if (!snap.exists) {
			throw new RegistrationNotFoundError(`Course not found: ${params.courseId}`);
		}
		const course = snap.data() as CourseDoc;
		const date = (course.dates ?? []).find((d) => matchDate(d, params.dateId));
		if (!date) {
			throw new RegistrationNotFoundError(`Date not found: ${params.dateId}`);
		}
		const participant = (date.participants ?? []).find((p) => p.id === params.participantId);
		if (!participant) {
			throw new RegistrationNotFoundError(`Participant not found: ${params.participantId}`);
		}

		const existing = parseStoredReceipt(participant.fakturownia);
		if (existing) {
			return { kind: 'exists', receipt: existing };
		}
		if (isActiveIssuingLock(participant.fakturownia)) {
			throw new ReceiptIssuingConflictError(
				'Trwa wystawianie paragonu. Odśwież za chwilę.'
			);
		}

		validateReceiptParticipant(course, date, participant);

		const issuingAt = new Date().toISOString();
		const dates = patchParticipantOnDate(
			course,
			params.dateId,
			params.participantId,
			(p) => ({
				...p,
				fakturownia: { status: 'issuing', issuingAt },
				fiscalError: null,
			})
		);
		tx.update(courseRef, { dates });

		return { kind: 'claimed', course, date, participant };
	});

	if (claimed.kind === 'exists') {
		return { alreadyExists: true, receipt: claimed.receipt };
	}

	const { course, date, participant } = claimed;
	const { amountNet } = validateReceiptParticipant(course, date, participant);

	const { domain, apiToken } = getFakturowniaConfig();
	const billing = await loadBilling(db, course.instructor?.id);
	const seller = asBilling(billing);

	const userSnap = await db.collection('users').doc(params.participantId).get();
	const user = (userSnap.exists ? userSnap.data() : {}) as UserDoc;
	const buyer = resolveProformaBuyer(
		{
			name: String(participant.name ?? ''),
			email: String(participant.email ?? ''),
			phoneNumber:
				typeof participant.phoneNumber === 'string' ? participant.phoneNumber : undefined,
			invoiceNip:
				typeof participant.invoiceNip === 'string' ? participant.invoiceNip : undefined,
			invoiceCompanyName:
				typeof participant.invoiceCompanyName === 'string'
					? participant.invoiceCompanyName
					: undefined,
			invoiceCompanyAddress:
				typeof participant.invoiceCompanyAddress === 'string'
					? participant.invoiceCompanyAddress
					: undefined,
		},
		user
	);

	const kind: ProformaCourseKind = course.kind === 'practice' ? 'practice' : 'course';
	const serviceName = formatProformaServiceName(kind, course.name?.trim() || 'Szkolenie');
	const timePart = date.timeStart?.trim() ? ` · ${date.timeStart.trim()}` : '';
	const serviceLine = `${serviceName} (${date.date}${timePart})`;

	const snapshot = participant.priceSnapshot as
		| {
				basePrice?: number;
				discountTotal?: number;
				finalPrice?: number;
				manualAdjustment?: { reason?: string };
		  }
		| undefined;

	const proformaNumber =
		typeof (participant.proforma as { number?: string } | undefined)?.number === 'string'
			? (participant.proforma as { number: string }).number
			: undefined;

	const oid = registrationReceiptOid(
		proformaNumber,
		`SZK/${params.courseId.slice(0, 8)}/${params.participantId.slice(0, 8)}`
	);

	const invoice = buildRegistrationReceiptPayload({
		oid,
		buyerName: String(participant.name ?? buyer.displayName ?? 'Uczestnik'),
		buyerEmail: String(participant.email ?? ''),
		buyerNip: buyer.nip,
		seller,
		serviceLine,
		amountNet: snapshot?.finalPrice ?? amountNet,
		baseAmountNet: snapshot?.basePrice ?? amountNet,
		discountTotal: snapshot?.discountTotal,
		discountReason: snapshot?.manualAdjustment?.reason,
	});

	if (invoice.positions.length === 0) {
		throw new FakturowniaApiError('Brak pozycji do paragonu', 400);
	}

	const clearIssuingLock = async (fiscalError: string) => {
		await db.runTransaction(async (tx) => {
			const snap = await tx.get(courseRef);
			if (!snap.exists) return;
			const fresh = snap.data() as CourseDoc;
			const dates = patchParticipantOnDate(
				fresh,
				params.dateId,
				params.participantId,
				(p) => {
					const { fakturownia: _lock, ...rest } = p as Record<string, unknown> & {
						fakturownia?: unknown;
					};
					return { ...rest, fiscalError };
				}
			);
			tx.update(courseRef, { dates });
		});
	};

	try {
		const created = await postFakturowniaReceipt(domain, apiToken, invoice, fetchImpl);
		const createdAt = new Date().toISOString();
		const receipt: FakturowniaReceiptRef = {
			receiptId: created.id,
			number: created.number,
			viewUrl: created.token ? buildReceiptViewUrl(domain, created.token) : null,
			createdAt,
		};

		await db.runTransaction(async (tx) => {
			const snap = await tx.get(courseRef);
			if (!snap.exists) return;
			const fresh = snap.data() as CourseDoc;
			const dates = patchParticipantOnDate(
				fresh,
				params.dateId,
				params.participantId,
				(p) => ({
					...p,
					fakturownia: receipt,
					fiscalStatus: 'pending',
					fiscalPrintedAt: null,
					fiscalError: null,
					printAttempts: 0,
				})
			);
			tx.update(courseRef, { dates });
		});

		return { alreadyExists: false, receipt };
	} catch (err) {
		const message =
			err instanceof Error ? err.message : 'Nie udało się wystawić paragonu w Fakturowni.';
		await clearIssuingLock(message);
		throw err;
	}
};

export const DEFAULT_SELLER = FALLBACK_BILLING;