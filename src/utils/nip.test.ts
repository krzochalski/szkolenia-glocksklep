import { describe, expect, it } from 'vitest';
import { isValidPolishNip, normalizeNip } from './nip';

describe('normalizeNip', () => {
	it('strips non-digits', () => {
		expect(normalizeNip('829-172-41-48')).toBe('8291724148');
	});
});

describe('isValidPolishNip', () => {
	it('accepts valid checksum', () => {
		expect(isValidPolishNip('8291724148')).toBe(true);
	});

	it('rejects invalid checksum', () => {
		expect(isValidPolishNip('1234567890')).toBe(false);
	});

	it('rejects wrong length', () => {
		expect(isValidPolishNip('123')).toBe(false);
	});
});