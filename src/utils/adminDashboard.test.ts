import { describe, expect, it } from 'vitest';
import type { Course, CourseClass, Participant, Place } from '@/types/course';
import { bruttoFromNetto } from '@/utils/pricing';
import {
	addCalendarDays,
	buildMonthlyRevenue,
	buildSignupsSpotlight,
	buildUpcomingDates,
	formatMonthLabelPl,
	revenueYearsPresent,
	sessionStatus,
	warsawYmd,
} from './adminDashboard';

const place = (name = 'Strzelnica'): Place => ({
	id: 'p1',
	name,
	slug: 'strzelnica',
	googleMapsLink: 'https://maps.example',
});

const participant = (partial: Partial<Participant> & Pick<Participant, 'id'>): Participant => ({
	name: 'Jan',
	email: 'jan@example.com',
	...partial,
});

const dateEntry = (partial: Partial<CourseClass> & Pick<CourseClass, 'id' | 'date'>): CourseClass => ({
	slotsMax: 10,
	timeStart: '09:00',
	participants: [],
	instructor: { id: 'i1', name: 'Instr', slug: 'instr', bio: '' },
	place: place(),
	...partial,
});

const course = (partial: Partial<Course> & Pick<Course, 'id' | 'name'>): Course => ({
	slug: partial.name.toLowerCase().replace(/\s+/g, '-'),
	description: '',
	price: 100,
	hours: 8,
	tags: [],
	level: 'basic',
	...partial,
});

describe('warsawYmd / addCalendarDays', () => {
	it('formats a known UTC instant as Warsaw calendar date', () => {
		// 2025-06-15 22:30 UTC = 2025-06-16 00:30 in Warsaw (CEST)
		expect(warsawYmd(new Date('2025-06-15T22:30:00.000Z'))).toBe('2025-06-16');
	});

	it('adds calendar days without DST shifts', () => {
		expect(addCalendarDays('2025-03-28', 3)).toBe('2025-03-31');
		expect(addCalendarDays('2025-12-30', 5)).toBe('2026-01-04');
	});
});

describe('sessionStatus', () => {
	it('returns cancelled when canceled flag is set', () => {
		expect(sessionStatus(dateEntry({ id: 'd', date: '2025-10-01', canceled: true, slotsMax: 2, participants: [
			participant({ id: 'a' }),
			participant({ id: 'b' }),
		] }))).toBe('cancelled');
	});

	it('returns full when seats exhausted', () => {
		expect(
			sessionStatus(
				dateEntry({
					id: 'd',
					date: '2025-10-01',
					slotsMax: 2,
					participants: [participant({ id: 'a' }), participant({ id: 'b' })],
				})
			)
		).toBe('full');
	});

	it('returns open otherwise', () => {
		expect(sessionStatus(dateEntry({ id: 'd', date: '2025-10-01' }))).toBe('open');
	});
});

describe('buildSignupsSpotlight', () => {
	it('ranks by fill ratio then signup count; skips past and cancelled', () => {
		const courses = [
			course({
				id: 'c1',
				name: 'Alpha',
				dates: [
					dateEntry({
						id: 'past',
						date: '2025-01-01',
						slotsMax: 2,
						participants: [participant({ id: '1' }), participant({ id: '2' })],
					}),
					dateEntry({
						id: 'cancelled',
						date: '2025-11-10',
						canceled: true,
						slotsMax: 2,
						participants: [participant({ id: '1' }), participant({ id: '2' })],
					}),
					dateEntry({
						id: 'half',
						date: '2025-11-05',
						slotsMax: 10,
						participants: Array.from({ length: 5 }, (_, i) => participant({ id: `h${i}` })),
					}),
				],
			}),
			course({
				id: 'c2',
				name: 'Beta',
				kind: 'practice',
				waitingListCount: 3,
				dates: [
					dateEntry({
						id: 'almost',
						date: '2025-11-08',
						slotsMax: 10,
						participants: Array.from({ length: 8 }, (_, i) => participant({ id: `a${i}` })),
					}),
					dateEntry({
						id: 'fullish',
						date: '2025-11-20',
						slotsMax: 10,
						participants: Array.from({ length: 9 }, (_, i) => participant({ id: `f${i}` })),
					}),
				],
			}),
		];
		const spotlight = buildSignupsSpotlight(courses, '2025-11-01');
		expect(spotlight.map((s) => s.dateId)).toEqual(['fullish', 'almost', 'half']);
		expect(spotlight[0]?.nearFull).toBe(true);
		expect(spotlight[0]?.kindLabel).toBe('Trening');
		expect(spotlight[0]?.waitingListCount).toBe(3);
		expect(spotlight.find((s) => s.dateId === 'half')?.fillRatio).toBe(0.5);
	});
});

describe('buildUpcomingDates', () => {
	it('returns chronological future items within horizon including cancelled', () => {
		const courses = [
			course({
				id: 'c1',
				name: 'Far',
				dates: [dateEntry({ id: 'far', date: '2025-12-20', timeStart: '10:00' })],
			}),
			course({
				id: 'c2',
				name: 'Soon',
				dates: [
					dateEntry({ id: 'soon', date: '2025-11-05', timeStart: '08:00' }),
					dateEntry({ id: 'cancel', date: '2025-11-06', canceled: true }),
					dateEntry({ id: 'past', date: '2025-10-01' }),
				],
			}),
		];
		const upcoming = buildUpcomingDates(courses, { days: 7, today: '2025-11-01' });
		expect(upcoming.map((u) => u.dateId)).toEqual(['soon', 'cancel']);
		expect(upcoming[1]?.status).toBe('cancelled');
		expect(upcoming[0]?.placeName).toBe('Strzelnica');
	});

	it('returns empty array when nothing in range', () => {
		const courses = [
			course({
				id: 'c1',
				name: 'X',
				dates: [dateEntry({ id: 'd', date: '2026-01-01' })],
			}),
		];
		expect(buildUpcomingDates(courses, { days: 7, today: '2025-11-01' })).toEqual([]);
	});
});

describe('buildMonthlyRevenue', () => {
	it('sums only paid participants by session month using netto then brutto', () => {
		const courses = [
			course({
				id: 'c1',
				name: 'Paid course',
				price: 100,
				dates: [
					dateEntry({
						id: 'oct',
						date: '2025-10-15',
						customPrice: 200,
						participants: [
							participant({ id: '1', paid: true }),
							participant({ id: '2', paid: true }),
							participant({ id: '3', paid: false }),
							participant({ id: '4' }),
						],
					}),
					dateEntry({
						id: 'nov',
						date: '2025-11-01',
						participants: [participant({ id: '5', paid: true })],
					}),
				],
			}),
		];
		const rows = buildMonthlyRevenue(courses, { year: 2025 });
		const oct = rows.find((r) => r.month === '2025-10');
		const nov = rows.find((r) => r.month === '2025-11');
		expect(oct?.netto).toBe(400);
		expect(oct?.brutto).toBe(bruttoFromNetto(400));
		expect(nov?.netto).toBe(100);
		expect(rows).toHaveLength(12);
		expect(rows[0]?.month).toBe('2025-01');
	});

	it('uses per-participant customPrice over date and course price', () => {
		const courses = [
			course({
				id: 'c1',
				name: 'Mixed',
				price: 100,
				dates: [
					dateEntry({
						id: 'oct',
						date: '2025-10-15',
						customPrice: 200,
						participants: [
							participant({ id: '1', paid: true, customPrice: 50 }),
							participant({ id: '2', paid: true }),
						],
					}),
				],
			}),
		];
		const rows = buildMonthlyRevenue(courses, { year: 2025 });
		const oct = rows.find((r) => r.month === '2025-10');
		expect(oct?.netto).toBe(250);
	});

	it('builds dense last-N-months window ending at today', () => {
		const courses = [
			course({
				id: 'c1',
				name: 'X',
				price: 50,
				dates: [
					dateEntry({
						id: 'd',
						date: '2025-09-10',
						participants: [participant({ id: '1', paid: true })],
					}),
				],
			}),
		];
		const rows = buildMonthlyRevenue(courses, { months: 3, today: '2025-11-15' });
		expect(rows.map((r) => r.month)).toEqual(['2025-09', '2025-10', '2025-11']);
		expect(rows[0]?.netto).toBe(50);
		expect(rows[1]?.netto).toBe(0);
	});
});

describe('revenueYearsPresent / formatMonthLabelPl', () => {
	it('lists years with paid revenue descending', () => {
		const courses = [
			course({
				id: 'c1',
				name: 'X',
				price: 10,
				dates: [
					dateEntry({
						id: 'a',
						date: '2024-05-01',
						participants: [participant({ id: '1', paid: true })],
					}),
					dateEntry({
						id: 'b',
						date: '2025-01-01',
						participants: [participant({ id: '2', paid: true })],
					}),
					dateEntry({
						id: 'c',
						date: '2023-01-01',
						participants: [participant({ id: '3' })],
					}),
				],
			}),
		];
		expect(revenueYearsPresent(courses)).toEqual([2025, 2024]);
	});

	it('formats Polish short month label', () => {
		expect(formatMonthLabelPl('2025-10')).toMatch(/paź/i);
		expect(formatMonthLabelPl('2025-10')).toContain('2025');
	});
});
