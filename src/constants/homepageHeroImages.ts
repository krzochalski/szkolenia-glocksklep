import { toOptimizedImagePath } from '@/utils/optimizedImagePath';

/** Allowed hero image paths under `public/hero/` (WebP from optimize-images). */
export const HOMEPAGE_HERO_IMAGES = [
	'/hero/idpa_competition_front.webp',
	'/hero/idpa_competition.webp',
	'/hero/ipsc_competition.webp',
	'/hero/ipsc_class.webp',
] as const;

export type HomepageHeroImage = (typeof HOMEPAGE_HERO_IMAGES)[number];

/** Normalize legacy `.png`/`.jpg` CMS values to the WebP allowlist entry. */
export const toHomepageHeroImage = (value: string): HomepageHeroImage | null => {
	const webp = toOptimizedImagePath(value);
	return (HOMEPAGE_HERO_IMAGES as readonly string[]).includes(webp)
		? (webp as HomepageHeroImage)
		: null;
};

export const isHomepageHeroImage = (value: string): value is HomepageHeroImage =>
	toHomepageHeroImage(value) !== null;
