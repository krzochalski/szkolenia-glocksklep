import { describe, expect, it } from 'vitest';
import { formatBookingSummary, formatCourseDatePl } from './formatEnrollment';

describe('formatCourseDatePl', () => {
	it('formats ISO date as Polish long date', () => {
		expect(formatCourseDatePl('2026-10-18')).toBe('18 października 2026');
	});
});

describe('formatBookingSummary', () => {
	it('joins course details into one summary line', () => {
		expect(
			formatBookingSummary({
				name: 'Movement Fundamentals',
				date: '2026-10-18',
				timeStart: '10:00',
				place: 'Strzelnica Czacz',
				price: 500,
			})
		).toBe('Movement Fundamentals, 18 października 2026, 10:00, Strzelnica Czacz, 500 zł');
	});

	it('uses em dash when place is missing', () => {
		expect(
			formatBookingSummary({
				name: 'Course',
				date: '2026-01-02',
				timeStart: '09:00',
				place: null,
				price: 100.5,
			})
		).toBe('Course, 2 stycznia 2026, 09:00, —, 100.50 zł');
	});
});
