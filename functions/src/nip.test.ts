import { describe, expect, it } from 'vitest';
import { isValidPolishNip, normalizeNip } from './nip';

describe('nip (functions)', () => {
	it('normalizes and validates', () => {
		expect(normalizeNip('829-172-41-48')).toBe('8291724148');
		expect(isValidPolishNip('8291724148')).toBe(true);
	});
});