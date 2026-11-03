import { describe, expect, it } from 'vitest';
import {
	CANCELLATION_DEADLINE_HOURS_BEFORE,
	cancellationDeadlineUtc,
	getUnenrollEligibility,
	sessionStartUtc,
	unenrollBlockedMessage,
} from './cancellationDeadline';

describe('cancellationDeadline', () => {
	it('exports the shared 96h constant for SZ-2 / SZ-7 / SZ-8', () => {
		expect(CANCELLATION_DEADLINE_HOURS_BEFORE).toBe(96);
	});

	it('maps Warsaw wall time to the correct UTC instant (winter CET)', () => {
		// 2025-01-15 10:00 Europe/Warsaw = 09:00 UTC
		const start = sessionStartUtc('2025-01-15', '10:00');
		expect(start.toISOString()).toBe('2025-01-15T09:00:00.000Z');
	});

	it('maps Warsaw wall time across DST (summer CEST)', () => {
		// 2025-07-15 10:00 Europe/Warsaw = 08:00 UTC
		const start = sessionStartUtc('2025-07-15', '10:00');
		expect(start.toISOString()).toBe('2025-07-15T08:00:00.000Z');
	});

	it('falls back to 00:00 Warsaw when time is missing or invalid', () => {
		expect(sessionStartUtc('2025-01-15', '').toISOString()).toBe('2025-01-14T23:00:00.000Z');
		expect(sessionStartUtc('2025-01-15', 'xx').toISOString()).toBe('2025-01-14T23:00:00.000Z');
	});

	it('places the cancellation deadline exactly 96h before session start', () => {
		const deadline = cancellationDeadlineUtc('2025-01-15', '10:00');
		expect(deadline.toISOString()).toBe('2025-01-11T09:00:00.000Z');
	});
});

describe('getUnenrollEligibility boundaries', () => {
	const date = '2025-01-15';
	const timeStart = '10:00';
	const start = sessionStartUtc(date, timeStart);
	const deadline = cancellationDeadlineUtc(date, timeStart);

	it('allows unenroll 96h + 1 minute before start', () => {
		const now = new Date(deadline.getTime() - 60_000);
		expect(
			getUnenrollEligibility({ now, date, timeStart, attendanceMarked: false })
		).toEqual({ allowed: true });
	});

	it('blocks unenroll exactly at the 96h deadline', () => {
		expect(
			getUnenrollEligibility({
				now: deadline,
				date,
				timeStart,
				attendanceMarked: false,
			})
		).toEqual({ allowed: false, reason: 'deadline_passed' });
	});

	it('blocks unenroll 96h − 1 minute before start', () => {
		const now = new Date(deadline.getTime() + 60_000);
		expect(
			getUnenrollEligibility({ now, date, timeStart, attendanceMarked: false })
		).toEqual({ allowed: false, reason: 'deadline_passed' });
	});

	it('blocks when attendance is marked even far before the deadline', () => {
		const now = new Date(deadline.getTime() - 7 * 24 * 60 * 60 * 1000);
		expect(
			getUnenrollEligibility({ now, date, timeStart, attendanceMarked: true })
		).toEqual({ allowed: false, reason: 'course_taken_place' });
	});

	it('blocks with course_taken_place once the session has started', () => {
		expect(
			getUnenrollEligibility({
				now: start,
				date,
				timeStart,
				attendanceMarked: false,
			})
		).toEqual({ allowed: false, reason: 'course_taken_place' });
	});

	it('prefers course_taken_place over deadline_passed after start', () => {
		const now = new Date(start.getTime() + 60_000);
		expect(
			getUnenrollEligibility({ now, date, timeStart, attendanceMarked: false })
		).toEqual({ allowed: false, reason: 'course_taken_place' });
	});
});

describe('unenrollBlockedMessage', () => {
	it('includes the shared hours constant in the deadline message', () => {
		expect(unenrollBlockedMessage('deadline_passed')).toContain(
			`${CANCELLATION_DEADLINE_HOURS_BEFORE}h`
		);
	});

	it('explains that the course already took place', () => {
		expect(unenrollBlockedMessage('course_taken_place')).toMatch(/odbyło/);
	});
});
