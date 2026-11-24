import type { CourseClass, FiscalStatus, Participant } from '@/types/course';
import { formatProformaServiceName } from '@/utils/courseKind';
import { resolveFiscalStatus } from '@/utils/fiscalPrint';

export type ParagonPanelChip = 'none' | 'issuing' | 'issued' | 'printed';

export const PARAGON_PANEL_CHIP_LABEL: Record<ParagonPanelChip, string> = {
	none: 'Brak paragonu',
	issuing: 'Wystawianie…',
	issued: 'Wystawiony',
	printed: 'Wydrukowany',
};

export const resolveParagonPanelChip = (
	participant: Participant,
	fiscalStatus: FiscalStatus | null
): ParagonPanelChip => {
	const raw = participant.fakturownia;
	if (raw?.status === 'issuing' && !raw.receiptId) return 'issuing';
	if (!raw?.receiptId) return 'none';
	const status = resolveFiscalStatus(fiscalStatus, true);
	return status === 'printed' ? 'printed' : 'issued';
};

export const paragonChipColor = (
	chip: ParagonPanelChip
): 'default' | 'success' | 'warning' | 'info' => {
	switch (chip) {
		case 'printed':
			return 'success';
		case 'issued':
			return 'info';
		case 'issuing':
			return 'warning';
		default:
			return 'default';
	}
};

export type ParagonIssueBlockReason =
	| 'invoice'
	| 'unpaid'
	| 'cash'
	| 'zero'
	| 'issuing'
	| null;

export const paragonIssueBlockReason = (
	participant: Participant,
	payableNetto: number
): ParagonIssueBlockReason => {
	if (participant.documentType === 'invoice') return 'invoice';
	if (participant.fakturownia?.status === 'issuing' && !participant.fakturownia.receiptId) {
		return 'issuing';
	}
	if (!participant.paid) return 'unpaid';
	if (participant.paysByCash) return 'cash';
	if (payableNetto <= 0) return 'zero';
	return null;
};

export const paragonIssueBlockTooltip = (reason: ParagonIssueBlockReason): string => {
	switch (reason) {
		case 'invoice':
			return 'Ten zapis wymaga faktury VAT, nie paragonu.';
		case 'unpaid':
			return 'Oznacz uczestnika jako opłaconego, aby wystawić paragon.';
		case 'cash':
			return 'Płatność gotówką — brak paragonu w Fakturowni.';
		case 'zero':
			return 'Kwota 0 zł — nie można wystawić paragonu.';
		case 'issuing':
			return 'Trwa wystawianie paragonu. Odśwież za chwilę.';
		default:
			return '';
	}
};

export const receiptEmailStatusLabel = (participant: Participant): string | null => {
	if (!participant.fakturownia?.receiptId) return null;
	const state = participant.receiptEmail;
	if (state?.sentAt) return 'E-mail: wysłano';
	if (state?.error) return `E-mail: błąd (${state.error})`;
	return 'E-mail: nie wysłano';
};

export const buildRegistrationServiceLine = (
	courseName: string,
	courseKind: 'course' | 'practice' | undefined,
	date: Pick<CourseClass, 'date' | 'timeStart'>
): string => {
	const serviceName = formatProformaServiceName({
		name: courseName,
		kind: courseKind,
	});
	const timePart = date.timeStart?.trim() ? ` · ${date.timeStart.trim()}` : '';
	return `${serviceName} (${date.date}${timePart})`;
};