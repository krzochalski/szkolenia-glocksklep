import { describe, expect, it } from 'vitest';

import { buildRegistrationReceiptPositions } from './receiptPositions';

describe('buildRegistrationReceiptPositions', () => {
	it('builds one VAT 23% row from final netto', () => {
		const rows = buildRegistrationReceiptPositions({
			serviceLine: 'Szkolenie (2026-03-01)',
			amountNet: 400,
			vatRatePercent: 23,
		});
		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({ quantity: 1, tax: 23, total_price_gross: 492 });
	});

	it('appends discount note to title', () => {
		const rows = buildRegistrationReceiptPositions({
			serviceLine: 'Szkolenie',
			amountNet: 350,
			baseAmountNet: 400,
			discountTotal: 50,
			discountReason: 'lojalność',
			vatRatePercent: 23,
		});
		expect(rows[0]?.name).toContain('rabat 50.00 zł');
		expect(rows[0]?.total_price_gross).toBe(430.5);
	});
});