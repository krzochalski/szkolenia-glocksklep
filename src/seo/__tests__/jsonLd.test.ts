import { describe, expect, it } from 'vitest';
import { courseJsonLd, homeJsonLd } from '../jsonLd';

describe('seo/jsonLd', () => {
	it('home graph has Organization and WebSite', () => {
		const ld = homeJsonLd();
		expect(ld['@graph']).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ '@type': 'Organization' }),
				expect.objectContaining({ '@type': 'WebSite' }),
			])
		);
	});

	it('course schema includes Offer in PLN', () => {
		const [course] = courseJsonLd({
			name: 'Test',
			slug: 'test',
			description: 'Opis',
			price: 500,
		});
		expect(course['@type']).toBe('Course');
		expect(course.offers).toEqual(
			expect.objectContaining({ priceCurrency: 'PLN', price: '500.00' })
		);
	});
});
