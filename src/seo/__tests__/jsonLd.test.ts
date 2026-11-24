import { describe, expect, it } from 'vitest';
import type { Course, CourseClass } from '@/types/course';
import {
	blogPostingJsonLd,
	coursePageJsonLd,
	courseTermEventJsonLd,
	homeJsonLd,
	localBusinessJsonLd,
	upcomingEventsJsonLd,
} from '../jsonLd';

const basePlace = {
	id: 'p1',
	name: 'Strzelnica Testowa',
	slug: 'test',
	googleMapsLink: 'https://maps.example/p',
};

const baseDate = (overrides: Partial<CourseClass> = {}): CourseClass => ({
	id: 'd1',
	slotsMax: 8,
	date: '2099-06-15',
	timeStart: '09:00',
	participants: [],
	instructor: { id: 'i1', name: 'Instr', slug: 'instr', bio: '' },
	place: basePlace,
	...overrides,
});

const baseCourse = (overrides: Partial<Course> = {}): Course => ({
	id: 'c1',
	name: 'Kurs testowy',
	slug: 'kurs-testowy',
	description: 'Opis szkolenia strzeleckiego w Poznaniu.',
	price: 500,
	hours: 6,
	tags: ['IPSC'],
	level: 'basic',
	dates: [baseDate()],
	...overrides,
});

describe('seo/jsonLd', () => {
	it('home graph has Organization, LocalBusiness and WebSite', () => {
		const ld = homeJsonLd();
		expect(ld['@graph']).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ '@type': 'Organization' }),
				expect.objectContaining({ '@type': 'SportsActivityLocation' }),
				expect.objectContaining({ '@type': 'WebSite' }),
			])
		);
	});

	it('localBusiness lists Wielkopolska in areaServed', () => {
		const lb = localBusinessJsonLd();
		expect(lb.areaServed).toEqual(
			expect.arrayContaining([expect.objectContaining({ name: 'Wielkopolska' })])
		);
	});

	it('course graph includes Course, instances, events, breadcrumbs and FAQ', () => {
		const ld = coursePageJsonLd({
			course: baseCourse(),
			faq: [{ title: 'Jak się zapisać?', content: 'Wybierz termin.' }],
		});
		const graph = ld['@graph'] as Record<string, unknown>[];
		const courseNode = graph.find((n) => n['@type'] === 'Course');
		expect(courseNode?.hasCourseInstance).toEqual(
			expect.arrayContaining([expect.objectContaining({ '@type': 'CourseInstance' })])
		);
		expect(graph.map((n) => n['@type'])).toEqual(
			expect.arrayContaining(['Course', 'BreadcrumbList', 'Event', 'FAQPage'])
		);
	});

	it('event offer reflects sold out and canceled', () => {
		const full = courseTermEventJsonLd(
			baseCourse(),
			baseDate({ participants: Array.from({ length: 8 }, (_, i) => ({ id: `u${i}`, name: 'U', email: 'a@b.c' })) })
		);
		expect(full?.offers).toEqual(
			expect.objectContaining({ availability: 'https://schema.org/SoldOut' })
		);

		const canceled = courseTermEventJsonLd(baseCourse(), baseDate({ canceled: true }));
		expect(canceled?.eventStatus).toBe('https://schema.org/EventCancelled');
	});

	it('upcomingEventsJsonLd maps future terms', () => {
		const ld = upcomingEventsJsonLd([baseCourse()]);
		const graph = ld['@graph'] as unknown[];
		expect(graph.length).toBeGreaterThan(0);
	});

	it('blogPostingJsonLd builds headline and publisher', () => {
		const ld = blogPostingJsonLd({
			slug: 'ipsc-poznan',
			title: 'Szkolenie IPSC',
			description: 'Praktyczne strzelanie',
			publishedAt: '2026-01-10',
		});
		expect(ld['@type']).toBe('BlogPosting');
		expect(ld.headline).toBe('Szkolenie IPSC');
		expect(ld.publisher).toEqual(expect.objectContaining({ '@id': expect.stringContaining('#organization') }));
	});
});