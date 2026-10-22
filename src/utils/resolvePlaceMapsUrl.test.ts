import { describe, expect, it } from 'vitest';
import { resolvePlaceMapsUrl } from './resolvePlaceMapsUrl';

describe('resolvePlaceMapsUrl', () => {
	it('prefers googleMapsLink over link', () => {
		expect(
			resolvePlaceMapsUrl({
				googleMapsLink: 'https://maps.google.com/?q=a',
				link: 'https://maps.google.com/?q=b',
			})
		).toBe('https://maps.google.com/?q=a');
	});

	it('falls back to legacy link', () => {
		expect(resolvePlaceMapsUrl({ googleMapsLink: '', link: 'https://maps.google.com/?q=b' })).toBe(
			'https://maps.google.com/?q=b'
		);
	});

	it('returns null when missing', () => {
		expect(resolvePlaceMapsUrl(null)).toBeNull();
		expect(resolvePlaceMapsUrl({ googleMapsLink: '  ', link: '' })).toBeNull();
	});
});
