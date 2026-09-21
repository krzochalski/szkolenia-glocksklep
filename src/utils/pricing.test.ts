import { describe, expect, it } from 'vitest';
import { bruttoFromNetto, formatCoursePrice } from './pricing';

describe('pricing', () => {
	it('adds 23% VAT by rounding VAT separately', () => {
		expect(bruttoFromNetto(850)).toBe(1045.5);
	});

	it('formats netto and brutto like Stayfrosty catalog tiles', () => {
		expect(formatCoursePrice(850, 'netto')).toBe('850.00PLN');
		expect(formatCoursePrice(850, 'brutto')).toBe('1045.50PLN');
	});
});
