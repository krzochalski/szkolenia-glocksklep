import { describe, expect, it } from 'vitest';
import { bruttoFromNetto, formatCoursePrice, formatPlnDisplay } from './pricing';

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
});
