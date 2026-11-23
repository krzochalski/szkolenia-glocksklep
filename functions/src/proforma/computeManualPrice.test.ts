// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { computeManualPrice } from './computeManualPrice';

describe('computeManualPrice (functions)', () => {
	it('mirrors app rules', () => {
		expect(computeManualPrice(1000, { type: 'percent', value: 10 })).toEqual({
			finalPrice: 900,
			discountTotal: 100,
		});
		expect(computeManualPrice(100, { type: 'fixed', value: 150 }).finalPrice).toBe(0);
	});
});
