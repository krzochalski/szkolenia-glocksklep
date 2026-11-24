import { describe, expect, it } from 'vitest';

import { expandEnrollmentReceiptPositions } from './enrollmentReceiptPositions';

describe('expandEnrollmentReceiptPositions', () => {
	it('matches functions gross for 400 netto @ 23%', () => {
		const rows = expandEnrollmentReceiptPositions({
			serviceLine: 'Szkolenie',
			amountNet: 400,
			vatRatePercent: 23,
		});
		expect(rows[0]?.brutto).toBe(492);
	});
});