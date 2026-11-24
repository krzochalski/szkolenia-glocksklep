import { describe, expect, it } from 'vitest';

import {
	canStartFiscalPrint,
	completeFiscalPrint,
	resolveFiscalStatus,
	resolvePrinterUiStatus,
} from './fiscalPrint';

describe('resolveFiscalStatus', () => {
	it('treats legacy fakturownia without status as pending', () => {
		expect(resolveFiscalStatus(null, true)).toBe('pending');
	});
});

describe('fiscal print state machine', () => {
	it('completes print from printing', () => {
		const done = completeFiscalPrint(
			{
				fiscalStatus: 'printing',
				fiscalPrintedAt: null,
				fiscalError: null,
				printAttempts: 1,
			},
			'2026-01-01T00:00:00Z'
		);
		expect(done.fiscalStatus).toBe('printed');
		expect(canStartFiscalPrint(done.fiscalStatus)).toBe(false);
	});
});

describe('resolvePrinterUiStatus', () => {
	it('offline without view url', () => {
		expect(resolvePrinterUiStatus('pending', null)).toBe('offline');
	});
});