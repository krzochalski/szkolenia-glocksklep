import type { ProformaBuyerInput } from './proforma/build';

export type SalesDocumentType = 'invoice' | 'receipt';

export const SALES_DOCUMENT_LABEL: Record<SalesDocumentType, string> = {
	invoice: 'Faktura VAT',
	receipt: 'Paragon',
};

export const salesDocumentLabel = (type: SalesDocumentType | undefined): string =>
	type ? SALES_DOCUMENT_LABEL[type] : SALES_DOCUMENT_LABEL.receipt;

export const deriveDocumentType = (nip: string | undefined | null): SalesDocumentType =>
	nip?.trim() ? 'invoice' : 'receipt';

type ParticipantBillingFields = {
	name?: string;
	email?: string;
	phoneNumber?: string;
	invoiceNip?: string;
	invoiceCompanyName?: string;
	invoiceCompanyAddress?: string;
};

export const resolveProformaBuyer = (
	participant: ParticipantBillingFields,
	user?: { nip?: string; displayName?: string; fullName?: string }
): ProformaBuyerInput => {
	const nip = participant.invoiceNip?.trim() || user?.nip?.trim() || undefined;
	const companyName = participant.invoiceCompanyName?.trim();
	const displayName =
		companyName ||
		participant.name?.trim() ||
		user?.fullName?.trim() ||
		user?.displayName?.trim() ||
		participant.email?.trim();
	return {
		displayName,
		email: participant.email,
		phone: participant.phoneNumber,
		nip,
		address: participant.invoiceCompanyAddress?.trim() || undefined,
	};
};