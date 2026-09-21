import { Paths } from '@constants/paths';
import { DEFAULT_OG_IMAGE_PATH, Links, SITE_NAME, SITE_ORIGIN, STATIC_SEO } from '@constants/seo';
import { absoluteUrl, itemDescription } from './meta';

export type JsonLd = Record<string, unknown>;

const organizationId = `${SITE_ORIGIN}/#organization`;
const websiteId = `${SITE_ORIGIN}/#website`;

export const organizationJsonLd = (): JsonLd => ({
	'@type': 'Organization',
	'@id': organizationId,
	name: SITE_NAME,
	url: SITE_ORIGIN,
	email: 'szkolenia@glocksklep.pl',
	logo: absoluteUrl(DEFAULT_OG_IMAGE_PATH),
	sameAs: [Links.shop, Links.instagram, Links.youtube].filter(Boolean),
});

export const websiteJsonLd = (): JsonLd => ({
	'@type': 'WebSite',
	'@id': websiteId,
	name: SITE_NAME,
	url: SITE_ORIGIN,
	inLanguage: 'pl-PL',
	publisher: { '@id': organizationId },
});

export const homeJsonLd = (): JsonLd => ({
	'@context': 'https://schema.org',
	'@graph': [organizationJsonLd(), websiteJsonLd()],
});

export const faqPageJsonLd = (
	items: readonly { title: string; content: string }[]
): JsonLd => ({
	'@context': 'https://schema.org',
	'@type': 'FAQPage',
	name: STATIC_SEO.faq.title,
	url: absoluteUrl(STATIC_SEO.faq.path),
	mainEntity: items.map((item) => ({
		'@type': 'Question',
		name: item.title,
		acceptedAnswer: {
			'@type': 'Answer',
			text: item.content,
		},
	})),
});

export const breadcrumbJsonLd = (
	items: readonly { name: string; path: string }[]
): JsonLd => ({
	'@context': 'https://schema.org',
	'@type': 'BreadcrumbList',
	itemListElement: items.map((item, index) => ({
		'@type': 'ListItem',
		position: index + 1,
		name: item.name,
		item: absoluteUrl(item.path),
	})),
});

export const collectionJsonLd = (input: {
	readonly name: string;
	readonly path: string;
	readonly description: string;
}): JsonLd => ({
	'@context': 'https://schema.org',
	'@type': 'CollectionPage',
	name: input.name,
	url: absoluteUrl(input.path),
	description: input.description,
	isPartOf: { '@id': websiteId },
});

export const courseJsonLd = (input: {
	readonly name: string;
	readonly slug: string;
	readonly description: string;
	readonly price: number;
}): JsonLd[] => {
	const path = `${Paths.courses}/${input.slug}`;
	const url = absoluteUrl(path);
	return [
		{
			'@context': 'https://schema.org',
			'@type': 'Course',
			name: input.name,
			description: itemDescription(input.description),
			provider: { '@id': organizationId },
			url,
			offers: {
				'@type': 'Offer',
				price: input.price.toFixed(2),
				priceCurrency: 'PLN',
				url,
				availability: 'https://schema.org/InStock',
			},
		},
		breadcrumbJsonLd([
			{ name: 'Główna', path: '/' },
			{ name: 'Szkolenia', path: Paths.courses },
			{ name: input.name, path },
		]),
	];
};
