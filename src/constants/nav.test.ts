import { describe, expect, it } from 'vitest';
import { isCurrentPath } from './nav';

describe('isCurrentPath', () => {
	it('treats only exact / as home', () => {
		expect(isCurrentPath('/', '/')).toBe(true);
		expect(isCurrentPath('/szkolenia', '/')).toBe(false);
	});

	it('treats nested course pages as Szkolenia', () => {
		expect(isCurrentPath('/szkolenia', '/szkolenia')).toBe(true);
		expect(isCurrentPath('/szkolenia/pistol-basic-course', '/szkolenia')).toBe(true);
	});
});
