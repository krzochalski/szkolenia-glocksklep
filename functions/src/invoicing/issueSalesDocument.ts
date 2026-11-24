import type { Firestore } from 'firebase-admin/firestore';
import type { SalesDocumentType } from '../salesDocument';

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
	| { status: 'issued' };

/**
 * Final sales document after payment confirmation.
 * - `invoice`: Fakturownia / external invoicing (not wired yet — no Fakturownia in repo).
 * - `receipt`: paragon generation (SZ-18).
 */
export const issueSalesDocumentAfterPayment = async (
	params: IssueSalesDocumentParams
): Promise<IssueSalesDocumentResult> => {
	if (!params.paid) {
		return { status: 'skipped', reason: 'not_paid' };
	}

	if (params.documentType === 'invoice') {
		// TODO(SZ-??): Wire Fakturownia final VAT invoice (buyer NIP from registration).
		return { status: 'skipped', reason: 'invoice_not_implemented' };
	}

	// TODO(SZ-18): Issue fiscal receipt (paragon) for documentType === 'receipt'.
	return { status: 'skipped', reason: 'receipt_sz_18' };
};