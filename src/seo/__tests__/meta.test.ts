import { describe, expect, it } from 'vitest';
import { absoluteUrl, canonicalPath, pageTitle, truncatePlainText } from '../meta';

describe('seo/meta', () => {
	it('builds page titles', () => {
		expect(pageTitle('FAQ')).toContain('Szkolenia Glocksklep');
	});

	it('canonicalizes paths', () => {
		expect(canonicalPath('/')).toBe('https://szkolenia.glocksklep.pl/');
		expect(canonicalPath('/szkolenia/')).toBe('https://szkolenia.glocksklep.pl/szkolenia');
	});

	it('absolutizes urls', () => {
		expect(absoluteUrl('/faq')).toBe('https://szkolenia.glocksklep.pl/faq');
	});

	it('truncates long descriptions', () => {
		const long = 'a'.repeat(200);
		expect(truncatePlainText(long).length).toBeLessThanOrEqual(161);
	});
});
