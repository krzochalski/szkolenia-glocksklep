import {
	OG_LOCALE,
	SITE_NAME,
	STATIC_SEO,
	type StaticSeoConfig,
	type StaticSeoPage,
} from '@constants/seo';
import type { Metadata } from 'next';
import { absoluteUrl, canonicalPath, defaultOgImageUrl, pageTitle } from './meta';

export const CATALOG_REVALIDATE_SECONDS = 300;

export const seoToMetadata = (
	cfg: StaticSeoConfig,
	options?: { readonly image?: string; readonly path?: string }
): Metadata => {
	const path = options?.path ?? cfg.path;
	const canonical = canonicalPath(path);
	const ogImage = options?.image ? absoluteUrl(options.image) : defaultOgImageUrl();
	const robots = cfg.noindex ? { index: false, follow: false } : { index: true, follow: true };
	const isHome = path === '/' || cfg.path === '/';
	const ogTitle = isHome ? cfg.title : pageTitle(cfg.title);

	return {
		title: isHome ? { absolute: cfg.title } : cfg.title,
		description: cfg.description,
		robots,
		alternates: { canonical },
		openGraph: {
			type: 'website',
			siteName: SITE_NAME,
			locale: OG_LOCALE,
			title: ogTitle,
			description: cfg.description,
			url: canonical,
			images: [{ url: ogImage }],
		},
		twitter: {
			card: 'summary_large_image',
			title: ogTitle,
			description: cfg.description,
			images: [ogImage],
		},
	};
};

export const staticPageMetadata = (page: StaticSeoPage, pathOverride?: string): Metadata =>
	seoToMetadata(STATIC_SEO[page], { path: pathOverride });

export const courseItemMetadata = (input: {
	readonly title: string;
	readonly description: string;
	readonly path: string;
	readonly image?: string;
}): Metadata =>
	seoToMetadata(
		{
			title: input.title,
			description: input.description,
			path: input.path,
			ogType: 'website',
		},
		{ image: input.image }
	);
