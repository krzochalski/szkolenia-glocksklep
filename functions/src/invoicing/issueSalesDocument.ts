import type { Firestore } from 'firebase-admin/firestore';

import type { SalesDocumentType } from '../salesDocument';
import { createReceiptForRegistration, FakturowniaApiError, FakturowniaConfigError } from './fakturownia';
import { sendParticipantReceiptMail, updateParticipantReceiptEmail } from './receiptMail';

export type IssueSalesDocumentParams = {
	db: Firestore;
	courseId: string;
	dateId: string;
	participantId: string;
	documentType: SalesDocumentType;
	/** Set when participant is marked paid (admin). */
	paid: boolean;
};

export type IssueSalesDocumentResult =
	| { status: 'skipped'; reason: string }
	| { status: 'queued' }
	| { status: 'issued'; receiptId?: number; alreadyExists?: boolean };

/**
 * Final sales document after payment confirmation.
 * - `invoice`: Fakturownia VAT invoice (not wired yet).
 * - `receipt`: Fakturownia paragon (SZ-18).
 */
export const issueSalesDocumentAfterPayment = async (
	params: IssueSalesDocumentParams
): Promise<IssueSalesDocumentResult> => {
	if (!params.paid) {
		return { status: 'skipped', reason: 'not_paid' };
	}

	if (params.documentType === 'invoice') {
		return { status: 'skipped', reason: 'invoice_not_implemented' };
	}

	try {
		const result = await createReceiptForRegistration(params.db, {
			courseId: params.courseId,
			dateId: params.dateId,
			participantId: params.participantId,
		});

		const courseSnap = await params.db.collection('courses').doc(params.courseId).get();
		const course = courseSnap.data() as { name?: string; dates?: Array<{ id?: string; date?: string; participants?: Array<{ id?: string; email?: string }> }> };
		const date = (course?.dates ?? []).find(
			(d) => d.id === params.dateId || d.date === params.dateId
		);
		const participant = (date?.participants ?? []).find((p) => p.id === params.participantId);
		const email = participant?.email?.trim();

		if (email && result.receipt.viewUrl) {
			const mail = await sendParticipantReceiptMail({
				to: email,
				courseName: course?.name?.trim() || 'Szkolenie',
				classDateYmd: date?.date ?? '',
				receipt: result.receipt,
			});
			await updateParticipantReceiptEmail(params.db, {
				courseId: params.courseId,
				dateId: params.dateId,
				participantId: params.participantId,
				sent: mail.sent,
				error: mail.reason,
			});
		}

		return {
			status: 'issued',
			receiptId: result.receipt.receiptId,
			alreadyExists: result.alreadyExists,
		};
	} catch (err) {
		if (err instanceof FakturowniaConfigError) {
			console.error('Fakturownia config:', err.message);
			return { status: 'skipped', reason: 'fakturownia_not_configured' };
		}
		if (err instanceof FakturowniaApiError) {
			console.error('Fakturownia API:', err.message, err.details);
			return { status: 'skipped', reason: 'fakturownia_error' };
		}
		console.error(err);
		return { status: 'skipped', reason: 'unknown_error' };
	}
};