import { describe, expect, it } from 'vitest';
import {
	badgeImageSelectOptions,
	catalogueSelectOptions,
	HERO_CATALOGUE_IMAGES,
	sessionImageSelectOptions,
	THUMBNAIL_CATALOGUE_IMAGES,
	toHeroCatalogueImage,
} from './catalogueImages';

describe('catalogueSelectOptions', () => {
	it('returns catalogue as-is when current is empty or already listed', () => {
		expect(catalogueSelectOptions(['/a.webp', '/b.webp'], '')).toEqual(['/a.webp', '/b.webp']);
		expect(catalogueSelectOptions(['/a.webp', '/b.webp'], '/a.webp')).toEqual([
			'/a.webp',
			'/b.webp',
		]);
	});

	it('prepends orphan/legacy current value', () => {
		expect(catalogueSelectOptions(['/a.webp'], '/hero/legacy.png')).toEqual([
			'/hero/legacy.webp',
			'/a.webp',
		]);
	});
});

describe('toHeroCatalogueImage', () => {
	it('accepts allowlisted paths including legacy extensions', () => {
		expect(toHeroCatalogueImage('/hero/ipsc_class.webp')).toBe('/hero/ipsc_class.webp');
		expect(toHeroCatalogueImage('/hero/missing.webp')).toBeNull();
	});
});

describe('badgeImageSelectOptions', () => {
	it('includes thumbnails when badge catalogue is empty', () => {
		const options = badgeImageSelectOptions('');
		expect(options.length).toBeGreaterThan(0);
		expect(options).toEqual(expect.arrayContaining([...THUMBNAIL_CATALOGUE_IMAGES]));
	});
});

describe('sessionImageSelectOptions', () => {
	it('falls back to heroes and thumbnails when sessions catalogue is empty', () => {
		const options = sessionImageSelectOptions('');
		expect(options.length).toBeGreaterThan(0);
		expect(options).toEqual(
			expect.arrayContaining([...HERO_CATALOGUE_IMAGES, ...THUMBNAIL_CATALOGUE_IMAGES])
		);
	});
});
