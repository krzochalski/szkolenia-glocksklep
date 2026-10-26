import { formatCurrencyAmount } from '@ui';
import { describe, expect, it } from 'vitest';
import {
	bruttoFromNetto,
	formatCoursePrice,
	formatPlnDisplay,
	formatPlnNettoBrutto,
} from './pricing';

describe('pricing', () => {
	it('adds 23% VAT by rounding VAT separately', () => {
		expect(bruttoFromNetto(850)).toBe(1045.5);
	});

	it('formats netto and brutto like Stayfrosty catalog tiles', () => {
		expect(formatCoursePrice(850, 'netto')).toBe('850.00PLN');
		expect(formatCoursePrice(850, 'brutto')).toBe('1045.50PLN');
	});

	it('formats nearest-date PLN without trailing .00', () => {
		expect(formatPlnDisplay(500)).toBe('500 zł');
		expect(formatPlnDisplay(500.5)).toBe('500.50 zł');
	});

	it('formats nearest-date PLN in brutto mode', () => {
		expect(formatPlnDisplay(500, 'brutto')).toBe('615 zł');
		expect(formatPlnDisplay(850, 'brutto')).toBe('1045.50 zł');
	});

	it('formats compact brutto-first dual label via Intl', () => {
		expect(formatPlnNettoBrutto(500)).toBe(
			`${formatCurrencyAmount(615)} brutto / ${formatCurrencyAmount(500)} netto`
		);
		expect(formatPlnNettoBrutto(850)).toBe(
			`${formatCurrencyAmount(1045.5)} brutto / ${formatCurrencyAmount(850)} netto`
		);
	});
});
