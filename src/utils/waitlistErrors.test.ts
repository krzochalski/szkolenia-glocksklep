import { afterEach, describe, expect, it, vi } from 'vitest';
import { mapWaitlistError, WAITLIST_JOIN_ERROR, WAITLIST_LEAVE_ERROR } from './waitlistErrors';

describe('mapWaitlistError', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('maps permission-denied code to Polish join message', () => {
		const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const err = Object.assign(new Error('Missing or insufficient permissions.'), {
			code: 'permission-denied',
		});
		expect(mapWaitlistError(err)).toBe(WAITLIST_JOIN_ERROR);
		expect(spy).toHaveBeenCalled();
	});

	it('maps raw permission message without code', () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		expect(mapWaitlistError(new Error('Missing or insufficient permissions.'))).toBe(
			WAITLIST_JOIN_ERROR
		);
	});

	it('uses leave fallback when provided', () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const err = Object.assign(new Error('PERMISSION_DENIED'), {
			code: 'PERMISSION_DENIED',
		});
		expect(mapWaitlistError(err, WAITLIST_LEAVE_ERROR)).toBe(WAITLIST_LEAVE_ERROR);
	});

	it('passes through safe Polish app messages', () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		expect(mapWaitlistError(new Error('Zaloguj się, aby dołączyć do listy oczekujących.'))).toBe(
			'Zaloguj się, aby dołączyć do listy oczekujących.'
		);
	});

	it('hides Firebase-prefixed messages', () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		expect(mapWaitlistError(new Error('Firebase: Error (auth/network-request-failed).'))).toBe(
			WAITLIST_JOIN_ERROR
		);
	});
});
