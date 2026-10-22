import {
	BADGE_CATALOGUE_IMAGES,
	HERO_CATALOGUE_IMAGES,
	SESSION_CATALOGUE_IMAGES,
	THUMBNAIL_CATALOGUE_IMAGES,
} from '@/generated/catalogueImages';
import { toOptimizedImagePath } from '@/utils/optimizedImagePath';

export {
	BADGE_CATALOGUE_IMAGES,
	HERO_CATALOGUE_IMAGES,
	SESSION_CATALOGUE_IMAGES,
	THUMBNAIL_CATALOGUE_IMAGES,
};

export type HeroCatalogueImage = (typeof HERO_CATALOGUE_IMAGES)[number];
export type ThumbnailCatalogueImage = (typeof THUMBNAIL_CATALOGUE_IMAGES)[number];
export type BadgeCatalogueImage = (typeof BADGE_CATALOGUE_IMAGES)[number];
export type SessionCatalogueImage = (typeof SESSION_CATALOGUE_IMAGES)[number];

const includesPath = (list: readonly string[], value: string): boolean =>
	list.includes(toOptimizedImagePath(value));

export const toHeroCatalogueImage = (value: string): HeroCatalogueImage | null => {
	const webp = toOptimizedImagePath(value);
	return includesPath(HERO_CATALOGUE_IMAGES, webp) ? (webp as HeroCatalogueImage) : null;
};

export const toThumbnailCatalogueImage = (value: string): ThumbnailCatalogueImage | null => {
	const webp = toOptimizedImagePath(value);
	return includesPath(THUMBNAIL_CATALOGUE_IMAGES, webp)
		? (webp as ThumbnailCatalogueImage)
		: null;
};

export const toSessionCatalogueImage = (value: string): SessionCatalogueImage | null => {
	const webp = toOptimizedImagePath(value);
	return includesPath(SESSION_CATALOGUE_IMAGES, webp) ? (webp as SessionCatalogueImage) : null;
};

/** Select options: catalogue + current value when it is a legacy/orphan path. */
export const catalogueSelectOptions = (
	catalogue: readonly string[],
	current: string
): string[] => {
	const webp = current.trim() ? toOptimizedImagePath(current) : '';
	if (webp && !catalogue.includes(webp)) {
		return [webp, ...catalogue];
	}
	return [...catalogue];
};

/**
 * Admin badge image picker: `/public/badges` first, then course thumbnails
 * so there are options before custom badge art is uploaded.
 */
export const badgeImageSelectOptions = (current: string): string[] => {
	const seen = new Set<string>();
	const merged: string[] = [];
	for (const src of [...BADGE_CATALOGUE_IMAGES, ...THUMBNAIL_CATALOGUE_IMAGES]) {
		if (seen.has(src)) continue;
		seen.add(src);
		merged.push(src);
	}
	return catalogueSelectOptions(merged, current);
};

/**
 * Session gallery picker: `/public/sessions` first, then heroes/thumbnails
 * so admins have options before dedicated session stills are uploaded.
 */
export const sessionImageSelectOptions = (current: string): string[] => {
	const seen = new Set<string>();
	const merged: string[] = [];
	for (const src of [
		...SESSION_CATALOGUE_IMAGES,
		...HERO_CATALOGUE_IMAGES,
		...THUMBNAIL_CATALOGUE_IMAGES,
	]) {
		if (seen.has(src)) continue;
		seen.add(src);
		merged.push(src);
	}
	return catalogueSelectOptions(merged, current);
};
