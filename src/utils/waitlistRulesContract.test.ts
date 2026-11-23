import { describe, expect, it } from 'vitest';

/**
 * Contract tests mirroring firestore.rules waitlist create allowlists.
 * Full emulator rules suite can be added later with @firebase/rules-unit-testing.
 */
const guestKeys = [
	'courseId',
	'courseName',
	'courseSlug',
	'userName',
	'email',
	'createdAt',
	'guest',
	'consentAt',
] as const;

const authRequiredKeys = [
	'courseId',
	'courseName',
	'courseSlug',
	'userId',
	'userName',
	'email',
	'createdAt',
	'consentAt',
] as const;

describe('waitlist rules contract', () => {
	it('guest create payload must include consentAt and exclude lastNotifiedTermId', () => {
		const payload = {
			courseId: 'c1',
			courseName: 'Trening Bezstrzałowy',
			courseSlug: 'trening-bezstrzalowy',
			userName: 'Gość',
			email: 'guest@example.com',
			createdAt: '2026-11-23T10:00:00.000Z',
			guest: true,
			consentAt: '2026-11-23T10:00:00.000Z',
		};
		expect(Object.keys(payload).sort()).toEqual([...guestKeys].sort());
		expect('lastNotifiedTermId' in payload).toBe(false);
	});

	it('auth create payload must include consentAt and must not set lastNotifiedTermId', () => {
		const payload = {
			courseId: 'c1',
			courseName: 'Trening Bezstrzałowy',
			courseSlug: 'trening-bezstrzalowy',
			userId: 'uid1',
			userName: 'Ada',
			email: 'ada@example.com',
			createdAt: '2026-11-23T10:00:00.000Z',
			consentAt: '2026-11-23T10:00:00.000Z',
		};
		for (const key of authRequiredKeys) {
			expect(payload).toHaveProperty(key);
		}
		expect('lastNotifiedTermId' in payload).toBe(false);
		expect('guest' in payload).toBe(false);
	});
});
