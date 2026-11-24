import { auth } from './auth';
import type { ParticipantFakturowniaReceipt } from '@/types/course';

export type CreateFakturowniaReceiptResult = {
	receipt: ParticipantFakturowniaReceipt;
	alreadyExists?: boolean;
};

/** Admin: create Fakturownia receipt for a registration. Requires Firebase ID token. */
export const createFakturowniaReceiptForRegistration = async (input: {
	courseId: string;
	dateId: string;
	participantId: string;
}): Promise<CreateFakturowniaReceiptResult> => {
	const user = auth.currentUser;
	if (!user) throw new Error('Wymagane logowanie.');
	const token = await user.getIdToken();
	const res = await fetch('/api/admin/registrations/fakturownia-receipt', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
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
	};
};