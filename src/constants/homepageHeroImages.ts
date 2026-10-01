import {
	HERO_CATALOGUE_IMAGES,
	type HeroCatalogueImage,
	toHeroCatalogueImage,
} from '@/constants/catalogueImages';

/** @deprecated Prefer `HERO_CATALOGUE_IMAGES` — kept for existing imports. */
export const HOMEPAGE_HERO_IMAGES = HERO_CATALOGUE_IMAGES;

export type HomepageHeroImage = HeroCatalogueImage;

/** Normalize legacy `.png`/`.jpg` CMS values to the WebP allowlist entry. */
export const toHomepageHeroImage = toHeroCatalogueImage;

export const isHomepageHeroImage = (value: string): value is HomepageHeroImage =>
	toHomepageHeroImage(value) !== null;
