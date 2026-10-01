import {
	HERO_CATALOGUE_IMAGES,
	THUMBNAIL_CATALOGUE_IMAGES,
} from '@/generated/catalogueImages';
import { toOptimizedImagePath } from '@/utils/optimizedImagePath';

export { HERO_CATALOGUE_IMAGES, THUMBNAIL_CATALOGUE_IMAGES };

export type HeroCatalogueImage = (typeof HERO_CATALOGUE_IMAGES)[number];
export type ThumbnailCatalogueImage = (typeof THUMBNAIL_CATALOGUE_IMAGES)[number];

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
