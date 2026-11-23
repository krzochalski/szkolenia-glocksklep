import { describe, expect, it } from 'vitest';
import { computeManualPrice, parseAdjustmentValue } from './computeManualPrice';

describe('computeManualPrice', () => {
	it('returns base when adjustment is null', () => {
		expect(computeManualPrice(850, null)).toEqual({
			finalPrice: 850,
			discountTotal: 0,
		});
	});

	it('sets finalPrice directly', () => {
		expect(computeManualPrice(850, { type: 'finalPrice', value: 700.555 })).toEqual({
			finalPrice: 700.56,
			discountTotal: 149.44,
		});
	});

	it('applies percent discount to base', () => {
		expect(computeManualPrice(1000, { type: 'percent', value: 10 })).toEqual({
			finalPrice: 900,
			discountTotal: 100,
		});
	});

	it('applies fixed PLN discount to base', () => {
		expect(computeManualPrice(850, { type: 'fixed', value: 50 })).toEqual({
			finalPrice: 800,
			discountTotal: 50,
		});
	});

	it('floors at 0 for oversize fixed discount', () => {
		expect(computeManualPrice(100, { type: 'fixed', value: 150 })).toEqual({
			finalPrice: 0,
			discountTotal: 100,
		});
	});

	it('allows 0 final price', () => {
		expect(computeManualPrice(500, { type: 'finalPrice', value: 0 })).toEqual({
			finalPrice: 0,
			discountTotal: 500,
		});
	});

	it('rejects percent outside 0–100', () => {
		expect(() => computeManualPrice(100, { type: 'percent', value: 101 })).toThrow(
			/0–100/
		);
	});

	it('rounds grosze on percent', () => {
		expect(computeManualPrice(100, { type: 'percent', value: 33.33 })).toEqual({
			finalPrice: 66.67,
			discountTotal: 33.33,
		});
	});
});

describe('parseAdjustmentValue', () => {
	it('parses empty as null', () => {
		expect(parseAdjustmentValue('')).toBeNull();
		expect(parseAdjustmentValue('  ')).toBeNull();
	});

	it('parses comma decimals', () => {
		expect(parseAdjustmentValue('12,5')).toBe(12.5);
	});
});
