import { formatCurrencyAmount } from '@ui';
import { describe, expect, it } from 'vitest';
import {
	bruttoFromNetto,
	effectiveEnrollmentNetto,
	formatCoursePrice,
	formatPlnDisplay,
	formatPlnNettoBrutto,
	parseParticipantCustomPriceNetto,
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

describe('effectiveEnrollmentNetto', () => {
	const course = { price: 850 };
	const date = { customPrice: 700 };

	it('uses course price when no date or participant override', () => {
		expect(effectiveEnrollmentNetto(course, {}, null)).toBe(850);
		expect(effectiveEnrollmentNetto(course, {})).toBe(850);
	});

	it('prefers date override over course price', () => {
		expect(effectiveEnrollmentNetto(course, date)).toBe(700);
		expect(effectiveEnrollmentNetto(course, date, {})).toBe(700);
	});

	it('prefers participant override over date and course', () => {
		expect(effectiveEnrollmentNetto(course, date, { customPrice: 500 })).toBe(500);
		expect(effectiveEnrollmentNetto(course, {}, { customPrice: 400 })).toBe(400);
	});

	it('treats participant customPrice 0 as a valid override', () => {
		expect(effectiveEnrollmentNetto(course, date, { customPrice: 0 })).toBe(0);
	});
});

describe('parseParticipantCustomPriceNetto', () => {
	it('clears on empty / null / undefined', () => {
		expect(parseParticipantCustomPriceNetto('')).toBeNull();
		expect(parseParticipantCustomPriceNetto(null)).toBeNull();
		expect(parseParticipantCustomPriceNetto(undefined)).toBeNull();
		expect(parseParticipantCustomPriceNetto('   ')).toBeNull();
	});

	it('accepts zero and positive netto', () => {
		expect(parseParticipantCustomPriceNetto(0)).toBe(0);
		expect(parseParticipantCustomPriceNetto('500')).toBe(500);
		expect(parseParticipantCustomPriceNetto(500.555)).toBe(500.56);
	});

	it('rejects NaN and negative', () => {
		expect(() => parseParticipantCustomPriceNetto('abc')).toThrow();
		expect(() => parseParticipantCustomPriceNetto(Number.NaN)).toThrow();
		expect(() => parseParticipantCustomPriceNetto(-1)).toThrow();
	});
});
