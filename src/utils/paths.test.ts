import { describe, expect, it } from 'vitest';
import {
	buildPostAuthPath,
	courseSlugFromRedirect,
	safeRedirectPath,
	withAuthReturnQuery,
	withRedirectQuery,
} from './paths';

describe('paths', () => {
	it('rejects open redirects', () => {
		expect(safeRedirectPath('https://evil.test', '/profil')).toBe('/profil');
		expect(safeRedirectPath('//evil.test', '/profil')).toBe('/profil');
		expect(safeRedirectPath('/szkolenia/foo', '/profil')).toBe('/szkolenia/foo');
	});

	it('appends redirect query', () => {
		expect(withRedirectQuery('/login', '/szkolenia/foo')).toBe(
			'/login?redirect=%2Fszkolenia%2Ffoo'
		);
	});

	it('builds auth return query with termin', () => {
		expect(
			withAuthReturnQuery('/login', { redirect: '/szkolenia/movement-fundamentals', termin: 'd1' })
		).toBe('/login?redirect=%2Fszkolenia%2Fmovement-fundamentals&termin=d1');
	});

	it('preserves existing query params on withAuthReturnQuery', () => {
		expect(
			withAuthReturnQuery('/login?reset=1', {
				redirect: '/szkolenia/foo',
				termin: 'abc',
			})
		).toBe('/login?reset=1&redirect=%2Fszkolenia%2Ffoo&termin=abc');
	});

	it('omits termin when absent', () => {
		expect(withAuthReturnQuery('/register', { redirect: '/profil' })).toBe(
			'/register?redirect=%2Fprofil'
		);
	});

	it('builds post-auth path with termin', () => {
		expect(buildPostAuthPath('/szkolenia/foo', 'date-1', '/profil')).toBe(
			'/szkolenia/foo?termin=date-1'
		);
		expect(buildPostAuthPath('/szkolenia/foo?termin=date-1', 'other', '/profil')).toBe(
			'/szkolenia/foo?termin=date-1'
		);
		expect(buildPostAuthPath(null, 'date-1', '/profil')).toBe('/profil?termin=date-1');
		expect(buildPostAuthPath('/szkolenia/foo', null, '/profil')).toBe('/szkolenia/foo');
	});

	it('extracts course slug from redirect', () => {
		expect(courseSlugFromRedirect('/szkolenia/movement-fundamentals')).toBe(
			'movement-fundamentals'
		);
		expect(courseSlugFromRedirect('/szkolenia/movement-fundamentals?termin=x')).toBe(
			'movement-fundamentals'
		);
		expect(courseSlugFromRedirect('/profil')).toBeNull();
		expect(courseSlugFromRedirect('https://evil.test')).toBeNull();
	});
});
