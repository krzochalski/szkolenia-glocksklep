import { PUBLIC_CONTACT_EMAIL } from '@constants/contact';
import {
	ORGANIZER_CITY,
	ORGANIZER_COUNTRY,
	ORGANIZER_LEGAL_NAME,
	ORGANIZER_PHONE_E164,
	ORGANIZER_POSTAL_CODE,
	ORGANIZER_STREET,
	TRAINING_AREA_SERVED,
} from '@constants/organizer';
import { Paths } from '@constants/paths';
import { DEFAULT_OG_IMAGE_PATH, Links, SITE_NAME, SITE_ORIGIN, STATIC_SEO } from '@constants/seo';
import type { Course, CourseClass, Place } from '@/types/course';
import {
	getFutureCourseDates,
	getSlotsLeft,
	isCourseClassCanceled,
	isFutureDate,
} from '@/utils/courseDates';
import { absoluteUrl, itemDescription, lastmodDate } from './meta';
import type { CourseFaqEntry } from './courseFaq';

export type JsonLd = Record<string, unknown>;

const organizationId = `${SITE_ORIGIN}/#organization`;
const localBusinessId = `${SITE_ORIGIN}/#localbusiness`;
const websiteId = `${SITE_ORIGIN}/#website`;

const postalAddress = () => ({
	'@type': 'PostalAddress',
	streetAddress: ORGANIZER_STREET,
	addressLocality: ORGANIZER_CITY,
	postalCode: ORGANIZER_POSTAL_CODE,
	addressCountry: ORGANIZER_COUNTRY,
});

export const organizationJsonLd = (): JsonLd => ({
	'@type': 'Organization',
	'@id': organizationId,
	name: SITE_NAME,
	legalName: ORGANIZER_LEGAL_NAME,
	url: SITE_ORIGIN,
	email: PUBLIC_CONTACT_EMAIL,
	telephone: ORGANIZER_PHONE_E164,
	logo: absoluteUrl(DEFAULT_OG_IMAGE_PATH),
	address: postalAddress(),
	areaServed: [...TRAINING_AREA_SERVED],
	sameAs: [Links.shop, Links.instagram, Links.youtube].filter(Boolean),
});

export const localBusinessJsonLd = (): JsonLd => ({
	'@type': 'SportsActivityLocation',
	'@id': localBusinessId,
	name: SITE_NAME,
	description:
		'Szkolenia i treningi strzeleckie — strzelectwo praktyczne IPSC / IDPA w Wielkopolsce i rejonie Poznania.',
	url: SITE_ORIGIN,
	email: PUBLIC_CONTACT_EMAIL,
	telephone: ORGANIZER_PHONE_E164,
	image: absoluteUrl(DEFAULT_OG_IMAGE_PATH),
	address: postalAddress(),
	areaServed: TRAINING_AREA_SERVED.map((name) => ({
		'@type': 'AdministrativeArea',
		name,
	})),
	parentOrganization: { '@id': organizationId },
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
	'@graph': [organizationJsonLd(), localBusinessJsonLd(), websiteJsonLd()],
});

export const faqPageJsonLd = (
	items: readonly { title: string; content: string }[],
	options?: { readonly name?: string; readonly path?: string }
): JsonLd => ({
	'@context': 'https://schema.org',
	'@type': 'FAQPage',
	name: options?.name ?? STATIC_SEO.faq.title,
	url: absoluteUrl(options?.path ?? STATIC_SEO.faq.path),
	mainEntity: items.map((item) => ({
		'@type': 'Question',
		name: item.title,
		acceptedAnswer: {
			'@type': 'Answer',
			text: item.content,
		},
	})),
});

export const personJsonLd = (input: {
	readonly name: string;
	readonly description: string;
	readonly imagePath: string;
	readonly email: string;
	readonly sameAs: readonly string[];
}): JsonLd => ({
	'@context': 'https://schema.org',
	'@type': 'Person',
	name: input.name,
	description: input.description,
	url: absoluteUrl(STATIC_SEO.about.path),
	image: absoluteUrl(input.imagePath),
	email: input.email,
	jobTitle: 'Instruktor szkoleń strzeleckich',
	worksFor: { '@id': organizationId },
	sameAs: [...input.sameAs],
});

const breadcrumbListNode = (items: readonly { name: string; path: string }[]): JsonLd => ({
	'@type': 'BreadcrumbList',
	itemListElement: items.map((item, index) => ({
		'@type': 'ListItem',
		position: index + 1,
		name: item.name,
		item: absoluteUrl(item.path),
	})),
});

export const breadcrumbJsonLd = (
	items: readonly { name: string; path: string }[]
): JsonLd => ({
	'@context': 'https://schema.org',
	...breadcrumbListNode(items),
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

const resolveTermPrice = (course: Course, date: CourseClass): number =>
	date.customPrice ?? course.price;

const termUrl = (slug: string, dateId: string): string =>
	`${absoluteUrl(`${Paths.courses}/${slug}`)}?termin=${encodeURIComponent(dateId)}`;

const placeLocation = (place: Place): JsonLd => ({
	'@type': 'Place',
	name: place.name,
	url: place.link?.trim() || place.googleMapsLink,
});

const availabilityUrl = (slotsLeft: number, canceled: boolean): string => {
	if (canceled) return 'https://schema.org/Discontinued';
	if (slotsLeft <= 0) return 'https://schema.org/SoldOut';
	return 'https://schema.org/InStock';
};

const eventStatus = (canceled: boolean): string =>
	canceled
		? 'https://schema.org/EventCancelled'
		: 'https://schema.org/EventScheduled';

const startDateTime = (date: CourseClass): string | undefined => {
	if (!isFutureDate(date.date)) return undefined;
	const time = /^\d{2}:\d{2}$/.test(date.timeStart) ? `${date.timeStart}:00` : '09:00:00';
	return `${date.date}T${time}+01:00`;
};

export const courseTermEventJsonLd = (course: Course, date: CourseClass): JsonLd | null => {
	const canceled = isCourseClassCanceled(date);
	if (!isFutureDate(date.date) && !canceled) return null;
	const start = startDateTime(date);
	if (!start && !canceled) return null;
	const slotsLeft = getSlotsLeft(date);
	const price = resolveTermPrice(course, date);
	const path = `${Paths.courses}/${course.slug}`;
	const label = date.subtitle?.trim()
		? `${course.name} — ${date.subtitle.trim()}`
		: `${course.name} — termin ${date.date}`;

	return {
		'@type': 'Event',
		'@id': `${absoluteUrl(path)}#termin-${date.id}`,
		name: label,
		description: itemDescription(course.description),
		startDate: start,
		eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
		eventStatus: eventStatus(canceled),
		location: placeLocation(date.place),
		organizer: { '@id': organizationId },
		performer: { '@id': organizationId },
		url: termUrl(course.slug, date.id),
		offers: {
			'@type': 'Offer',
			price: price.toFixed(2),
			priceCurrency: 'PLN',
			url: termUrl(course.slug, date.id),
			availability: availabilityUrl(slotsLeft, canceled),
			validFrom: lastmodDate(new Date().toISOString()),
		},
	};
};

export const courseInstanceJsonLd = (
	course: Course,
	date: CourseClass,
	courseUrl: string
): JsonLd | null => {
	const canceled = isCourseClassCanceled(date);
	if (!isFutureDate(date.date) && !canceled) return null;
	return {
		'@type': 'CourseInstance',
		'@id': `${courseUrl}#instance-${date.id}`,
		name: date.subtitle?.trim() || course.name,
		courseMode: 'onsite',
		startDate: date.date,
		location: placeLocation(date.place),
		offers: {
			'@type': 'Offer',
			price: resolveTermPrice(course, date).toFixed(2),
			priceCurrency: 'PLN',
			availability: availabilityUrl(getSlotsLeft(date), canceled),
		},
	};
};

export type CourseJsonLdInput = {
	readonly course: Course;
	readonly faq?: readonly CourseFaqEntry[];
};

export const coursePageJsonLd = ({ course, faq }: CourseJsonLdInput): JsonLd => {
	const path = `${Paths.courses}/${course.slug}`;
	const courseUrl = absoluteUrl(path);
	const instances: JsonLd[] = [];
	const events: JsonLd[] = [];
	for (const date of course.dates ?? []) {
		const instance = courseInstanceJsonLd(course, date, courseUrl);
		if (instance) instances.push(instance);
		const event = courseTermEventJsonLd(course, date);
		if (event) events.push(event);
	}

	const graph: JsonLd[] = [
		{
			'@type': 'Course',
			'@id': `${courseUrl}#course`,
			name: course.name,
			description: itemDescription(course.description),
			provider: { '@id': organizationId },
			url: courseUrl,
			inLanguage: 'pl-PL',
			...(instances.length ? { hasCourseInstance: instances } : {}),
			offers: {
				'@type': 'Offer',
				price: course.price.toFixed(2),
				priceCurrency: 'PLN',
				url: courseUrl,
				availability: 'https://schema.org/InStock',
			},
		},
		breadcrumbListNode([
			{ name: 'Główna', path: '/' },
			{ name: 'Szkolenia', path: Paths.courses },
			{ name: course.name, path },
		]),
		...events,
	];

	if (faq?.length) {
		graph.push({
			'@type': 'FAQPage',
			'@id': `${courseUrl}#faq`,
			mainEntity: faq.map((item) => ({
				'@type': 'Question',
				name: item.title,
				acceptedAnswer: { '@type': 'Answer', text: item.content },
			})),
		});
	}

	return {
		'@context': 'https://schema.org',
		'@graph': graph,
	};
};


export const upcomingEventsJsonLd = (courses: readonly Course[]): JsonLd => {
	const graph = getFutureCourseDates([...courses])
		.map(({ course, date }) => courseTermEventJsonLd(course, date))
		.filter((node): node is JsonLd => node != null);

	return {
		'@context': 'https://schema.org',
		'@graph': graph,
	};
};

export type BlogPostingInput = {
	readonly slug: string;
	readonly title: string;
	readonly description: string;
	readonly publishedAt: string;
	readonly updatedAt?: string;
	readonly imagePath?: string;
};

export const blogPostingJsonLd = (input: BlogPostingInput): JsonLd => {
	const path = `/blog/${input.slug}`;
	const url = absoluteUrl(path);
	return {
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		headline: input.title,
		description: itemDescription(input.description),
		url,
		mainEntityOfPage: url,
		datePublished: input.publishedAt,
		dateModified: input.updatedAt ?? input.publishedAt,
		inLanguage: 'pl-PL',
		author: { '@id': organizationId },
		publisher: { '@id': organizationId },
		...(input.imagePath ? { image: absoluteUrl(input.imagePath) } : {}),
	};
};