import { DEFAULT_DESCRIPTION, SITE_NAME } from '@constants/seo';
import type { MetadataRoute } from 'next';
import { brand } from '@ui';

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: SITE_NAME,
		short_name: 'Szkolenia',
		description: DEFAULT_DESCRIPTION,
		start_url: '/',
		scope: '/',
		display: 'standalone',
		lang: 'pl',
		background_color: brand.paper,
		theme_color: brand.ink,
		icons: [
			{
				src: '/pwa-192x192.png',
				sizes: '192x192',
				type: 'image/png',
				purpose: 'any',
			},
			{
				src: '/pwa-512x512.png',
				sizes: '512x512',
				type: 'image/png',
				purpose: 'any',
			},
			{
				src: '/pwa-maskable-192x192.png',
				sizes: '192x192',
				type: 'image/png',
				purpose: 'maskable',
			},
			{
				src: '/pwa-maskable-512x512.png',
				sizes: '512x512',
				type: 'image/png',
				purpose: 'maskable',
			},
		],
	};
}
