import { describe, expect, it } from 'vitest';
import { toOptimizedImagePath } from './optimizedImagePath';

describe('toOptimizedImagePath', () => {
	it('rewrites png and jpeg extensions to webp', () => {
		expect(toOptimizedImagePath('/hero/a.png')).toBe('/hero/a.webp');
		expect(toOptimizedImagePath('/hero/a.JPG')).toBe('/hero/a.webp');
		expect(toOptimizedImagePath('/hero/a.jpeg')).toBe('/hero/a.webp');
	});

	it('leaves webp and other paths unchanged', () => {
		expect(toOptimizedImagePath('/hero/a.webp')).toBe('/hero/a.webp');
		expect(toOptimizedImagePath('/og-default.webp')).toBe('/og-default.webp');
	});
});
