import { describe, expect, it } from 'vitest';
import {
	buildWaitlistTermEmailPayload,
	findWaitlistNotifyCandidates,
} from './waitlistTermNotify';
import {
	buildWaitlistUnsubscribeToken,
	parseWaitlistUnsubscribeToken,
} from './waitlistUnsubscribe';

describe('findWaitlistNotifyCandidates', () => {
	const future = '2099-06-15';
	const today = '2026-11-23';

	it('detects a newly added future open term', () => {
		const candidates = findWaitlistNotifyCandidates({
			beforeDates: [],
			afterDates: [
				{
					id: 'd1',
					date: future,
					timeStart: '10:00',
					slotsMax: 4,
					canceled: false,
				},
			],
			todayYmd: today,
		});
		expect(candidates.map((d) => d.id)).toEqual(['d1']);
	});

	it('skips edits to an already-notified term', () => {
		const term = {
			id: 'd1',
			date: future,
			timeStart: '11:00',
			slotsMax: 4,
			waitlistNotifiedAt: '2026-11-01T00:00:00.000Z',
		};
		const candidates = findWaitlistNotifyCandidates({
			beforeDates: [{ ...term, timeStart: '10:00' }],
			afterDates: [term],
			todayYmd: today,
		});
		expect(candidates).toEqual([]);
	});

	it('notifies when a canceled future term is restored', () => {
		const candidates = findWaitlistNotifyCandidates({
			beforeDates: [{ id: 'd1', date: future, canceled: true }],
			afterDates: [{ id: 'd1', date: future, canceled: false }],
			todayYmd: today,
		});
		expect(candidates.map((d) => d.id)).toEqual(['d1']);
	});

	it('skips inactive courses and past dates', () => {
		expect(
			findWaitlistNotifyCandidates({
				beforeDates: [],
				afterDates: [{ id: 'd1', date: future }],
				inactive: true,
				todayYmd: today,
			})
		).toEqual([]);
		expect(
			findWaitlistNotifyCandidates({
				beforeDates: [],
				afterDates: [{ id: 'd1', date: '2020-01-01' }],
				todayYmd: today,
			})
		).toEqual([]);
	});
});

describe('buildWaitlistTermEmailPayload', () => {
	it('includes term details and CTA links', () => {
		const payload = buildWaitlistTermEmailPayload({
			courseName: 'Trening Bezstrzałowy',
			courseSlug: 'trening-bezstrzalowy',
			date: '2099-06-15',
			timeStart: '18:00',
			placeName: 'Rankor',
			priceLabel: '150.00 PLN netto',
			freeSeats: 3,
			slotsMax: 4,
			registrationDeadline: '2099-06-08',
			termId: 'term-1',
			unsubscribeUrl: 'https://szkolenia.glocksklep.pl/lista-oczekujacych/wypisz?token=abc',
			recipientName: 'Ada',
		});
		expect(payload.subject).toContain('Trening Bezstrzałowy');
		expect(payload.subject).toContain('2099-06-15');
		expect(payload.html).toContain('Zapisz się');
		expect(payload.html).toContain('termin=term-1');
		expect(payload.html).toContain('Wypisz się z listy oczekujących');
		expect(payload.text).toContain('Rankor');
		expect(payload.text).toContain('150.00 PLN netto');
	});
});

describe('waitlist unsubscribe token', () => {
	it('round-trips entry id / email / courseId', () => {
		process.env.WAITLIST_UNSUB_SECRET = 'test-secret';
		const token = buildWaitlistUnsubscribeToken({
			entryId: 'c1_guest_a@b.c',
			email: 'A@B.C',
			courseId: 'c1',
		});
		const parsed = parseWaitlistUnsubscribeToken(token);
		expect(parsed).toEqual({
			ok: true,
			entryId: 'c1_guest_a@b.c',
			courseId: 'c1',
			email: 'a@b.c',
		});
	});
});
