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

	it('formats compact netto/brutto dual label', () => {
		expect(formatPlnNettoBrutto(500)).toBe('500 zł netto / 615 zł brutto');
		expect(formatPlnNettoBrutto(850)).toBe('850 zł netto / 1045.50 zł brutto');
	});
});
