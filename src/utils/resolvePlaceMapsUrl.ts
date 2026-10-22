import type { Place } from '@/types/course';

/** Canonical Google Maps URL for a place (`googleMapsLink`, else legacy `link`). */
export const resolvePlaceMapsUrl = (
	place?: Pick<Place, 'googleMapsLink' | 'link'> | null
): string | null => {
	const primary = place?.googleMapsLink?.trim();
	if (primary) return primary;
	const legacy = place?.link?.trim();
	return legacy || null;
};
