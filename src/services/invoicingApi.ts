import { auth } from './auth';
import type { ParticipantFakturowniaReceipt, ParticipantReceiptEmailState } from '@/types/course';

export type CreateFakturowniaReceiptResult = {
	receipt: ParticipantFakturowniaReceipt;
	alreadyExists?: boolean;
	email?: ParticipantReceiptEmailState & { sent?: boolean; error?: string };
};

export type ResendFakturowniaReceiptEmailResult = {
	receipt: ParticipantFakturowniaReceipt;
	email: { sent: boolean; error?: string };
};

const authHeaders = async (): Promise<HeadersInit> => {
	const user = auth.currentUser;
	if (!user) throw new Error('Wymagane logowanie.');
	const token = await user.getIdToken();
	return {
		Authorization: `Bearer ${token}`,
		'Content-Type': 'application/json',
	};
};

/** Admin: create Fakturownia receipt for a registration. Requires Firebase ID token. */
export const createFakturowniaReceiptForRegistration = async (input: {
	courseId: string;
	dateId: string;
	participantId: string;
	sendEmail?: boolean;
}): Promise<CreateFakturowniaReceiptResult> => {
	const res = await fetch('/api/admin/registrations/fakturownia-receipt', {
		method: 'POST',
		headers: await authHeaders(),
		body: JSON.stringify(input),
	});
	const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
	if (!res.ok) {
		const message =
			typeof data.error === 'string' ? data.error : 'Nie udało się wystawić paragonu.';
		throw new Error(message);
	}
	return {
		receipt: data.receipt as ParticipantFakturowniaReceipt,
		alreadyExists: res.status === 409,
		email: data.email as CreateFakturowniaReceiptResult['email'],
	};
};

/** Admin: resend paragon e-mail for an existing registration receipt. */
export const resendFakturowniaReceiptEmail = async (input: {
	courseId: string;
	dateId: string;
	participantId: string;
}): Promise<ResendFakturowniaReceiptEmailResult> => {
	const res = await fetch('/api/admin/registrations/fakturownia-receipt/resend-email', {
		method: 'POST',
		headers: await authHeaders(),
		body: JSON.stringify(input),
	});
	const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
	if (!res.ok) {
		const message =
			typeof data.error === 'string'
				? data.error
				: 'Nie udało się wysłać e-maila z paragonem.';
		throw new Error(message);
	}
	return {
		receipt: data.receipt as ParticipantFakturowniaReceipt,
		email: data.email as ResendFakturowniaReceiptEmailResult['email'],
	};
};