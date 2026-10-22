'use client';

import { Link, type LinkProps } from '@ui';
import type { Place } from '@/types/course';
import { resolvePlaceMapsUrl } from '@/utils/resolvePlaceMapsUrl';

type PlaceNameLinkProps = {
	readonly place?: Pick<Place, 'name' | 'googleMapsLink' | 'link'> | null;
	readonly fallback?: string;
	readonly sx?: LinkProps['sx'];
};

/** Place name; links to Google Maps when a URL is available. */
export const PlaceNameLink = ({ place, fallback = '—', sx }: PlaceNameLinkProps) => {
	const name = place?.name?.trim() || fallback;
	const href = resolvePlaceMapsUrl(place);
	if (!href) return <>{name}</>;

	return (
		<Link
			href={href}
			target='_blank'
			rel='noopener noreferrer'
			underline='hover'
			sx={{
				fontWeight: 700,
				color: 'primary.main',
				...((sx ?? {}) as object),
			}}
		>
			{name}
		</Link>
	);
};
