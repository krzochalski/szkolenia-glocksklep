import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Contract tests mirroring firestore.rules waitlist create allowlists
 * and the null-resource get fix (existence probe on deterministic auth ids).
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

const authAllowedKeys = [
	'courseId',
	'courseName',
	'courseSlug',
	'userId',
	'userName',
	'email',
	'createdAt',
	'consentAt',
	'phoneNumber',
] as const;

const rules = readFileSync(resolve(__dirname, '../../firestore.rules'), 'utf8');

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

	it('auth create payload must include consentAt and may include phoneNumber', () => {
		const payload = {
			courseId: 'c1',
			courseName: 'Trening Bezstrzałowy',
			courseSlug: 'trening-bezstrzalowy',
			userId: 'uid1',
			userName: 'Ada',
			email: 'ada@example.com',
			createdAt: '2026-11-23T10:00:00.000Z',
			consentAt: '2026-11-23T10:00:00.000Z',
			phoneNumber: '+48123123123',
		};
		for (const key of Object.keys(payload)) {
			expect(authAllowedKeys).toContain(key);
		}
		expect('lastNotifiedTermId' in payload).toBe(false);
		expect('guest' in payload).toBe(false);
	});

	it('allows get when resource is null for own deterministic auth entry id', () => {
		expect(rules).toContain('resource == null && isOwnAuthWaitingListDocId()');
		expect(rules).toContain("entryId.matches('^.+_' + request.auth.uid + '$')");
	});

	it('binds create doc id to courseId_uid / courseId_guest_email', () => {
		expect(rules).toContain("entryId == request.resource.data.courseId + '_' + request.auth.uid");
		expect(rules).toContain("entryId == request.resource.data.courseId + '_guest_'");
	});

	it('uses hasOnly for auth create (no lastNotifiedTermId)', () => {
		expect(rules).toMatch(/function authWaitingListCreate\(\)[\s\S]*?keys\(\)\.hasOnly\(\[/);
		expect(rules).toContain("'phoneNumber'");
	});
});
