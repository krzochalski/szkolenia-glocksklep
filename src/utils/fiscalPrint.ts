/**
 * Fiscal print helpers for Fakturownia paragons (SZ-18).
 * Adapted from stayfrosty `src/utils/fiscalPrint.ts` — same Fakturownia open/print flow.
 */

import { adminCourseDateParticipantParagonPath } from '@/constants/paths';

import { type ExternalTab, navigateExternalTab } from './externalTab';

export type FiscalStatus = 'pending' | 'printing' | 'printed' | 'failed';

export const FISCAL_STATUSES: FiscalStatus[] = ['pending', 'printing', 'printed', 'failed'];

export const FISCAL_STATUS_LABELS: Record<FiscalStatus, string> = {
	pending: 'Do druku',
	printing: 'Drukowanie…',
	printed: 'Wydrukowano',
	failed: 'Błąd druku',
};

export const AUTO_PRINT_STORAGE_KEY = 'admin.autoPrintParagon';

export type FiscalPrintState = {
	fiscalStatus: FiscalStatus;
	fiscalPrintedAt: string | null;
	fiscalError: string | null;
	printAttempts: number;
};

export type PrinterUiStatus = 'ready' | 'busy' | 'offline';

export const PRINTER_UI_STATUS_LABELS: Record<PrinterUiStatus, string> = {
	ready: 'Połączona',
	busy: 'Zajęta',
	offline: 'Niedostępna',
};

export const parseFiscalStatus = (value: unknown): FiscalStatus | null => {
	if (typeof value !== 'string') return null;
	return (FISCAL_STATUSES as readonly string[]).includes(value) ? (value as FiscalStatus) : null;
};

/** Legacy registrations with Fakturownia receipt but no fiscalStatus → pending. */
export const resolveFiscalStatus = (
	status: FiscalStatus | null | undefined,
	hasFakturownia: boolean
): FiscalStatus | null => {
	if (status) return status;
	if (hasFakturownia) return 'pending';
	return null;
};

export const canStartFiscalPrint = (status: FiscalStatus | null): boolean =>
	status === 'pending' || status === 'failed';

export const canReprint = (status: FiscalStatus | null): boolean => status === 'printed';

export const beginFiscalPrint = (state: FiscalPrintState): FiscalPrintState | null => {
	if (!canStartFiscalPrint(state.fiscalStatus)) return null;
	return {
		fiscalStatus: 'printing',
		fiscalPrintedAt: state.fiscalPrintedAt,
		fiscalError: null,
		printAttempts: state.printAttempts + 1,
	};
};

export const beginFiscalReprint = (state: FiscalPrintState): FiscalPrintState | null => {
	if (!canReprint(state.fiscalStatus)) return null;
	return {
		fiscalStatus: 'printing',
		fiscalPrintedAt: state.fiscalPrintedAt,
		fiscalError: null,
		printAttempts: state.printAttempts + 1,
	};
};

export const completeFiscalPrint = (state: FiscalPrintState, printedAt: string): FiscalPrintState => ({
	...state,
	fiscalStatus: 'printed',
	fiscalPrintedAt: printedAt,
	fiscalError: null,
});

export const failFiscalPrint = (state: FiscalPrintState, error: string): FiscalPrintState => ({
	...state,
	fiscalStatus: 'failed',
	fiscalError: error,
});

export const resolvePrinterUiStatus = (
	fiscalStatus: FiscalStatus | null,
	viewUrl: string | null | undefined,
	openFailed = false
): PrinterUiStatus => {
	if (fiscalStatus === 'printing') return 'busy';
	if (!viewUrl || openFailed || fiscalStatus === 'failed') return 'offline';
	return 'ready';
};

export const readAutoPrintPreference = (): boolean => {
	if (typeof window === 'undefined') return false;
	try {
		return window.localStorage.getItem(AUTO_PRINT_STORAGE_KEY) === '1';
	} catch {
		return false;
	}
};

export const writeAutoPrintPreference = (enabled: boolean): void => {
	if (typeof window === 'undefined') return;
	try {
		window.localStorage.setItem(AUTO_PRINT_STORAGE_KEY, enabled ? '1' : '0');
	} catch {
		// ignore quota / private mode
	}
};

export const redirectAfterFakturowniaCreate = (
	push: (href: string) => void,
	courseId: string,
	dateId: string,
	participantId: string
): void => {
	push(adminCourseDateParticipantParagonPath(courseId, dateId, participantId));
};

export const openFakturowniaReceipt = (viewUrl: string, tab?: ExternalTab | null): boolean =>
	navigateExternalTab(viewUrl, tab);