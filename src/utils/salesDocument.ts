import type { Participant, SalesDocumentType } from '@/types/course';
import type { ProformaBuyerInfo } from '@/services/proformaInvoices';

export const SALES_DOCUMENT_LABEL: Record<SalesDocumentType, string> = {
	invoice: 'Faktura VAT',
	receipt: 'Paragon',
};

export const salesDocumentLabel = (type: SalesDocumentType | undefined): string =>
	type ? SALES_DOCUMENT_LABEL[type] : SALES_DOCUMENT_LABEL.receipt;

/** NIP at enrollment → invoice; otherwise receipt (paragon). */
export const deriveDocumentType = (nip: string | undefined | null): SalesDocumentType =>
	nip?.trim() ? 'invoice' : 'receipt';

export const resolveProformaBuyer = (
	participant: Pick<
		Participant,
		'name' | 'email' | 'phoneNumber' | 'invoiceNip' | 'invoiceCompanyName' | 'invoiceCompanyAddress'
	>,
	profileNip?: string | null
): ProformaBuyerInfo => {
	const nip = participant.invoiceNip?.trim() || profileNip?.trim() || undefined;
	const companyName = participant.invoiceCompanyName?.trim();
	return {
		displayName: companyName || participant.name?.trim() || participant.email?.trim(),
		email: participant.email,
		phone: participant.phoneNumber,
		nip,
		address: participant.invoiceCompanyAddress?.trim() || undefined,
	};
};