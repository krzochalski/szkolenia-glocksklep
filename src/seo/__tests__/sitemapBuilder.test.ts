import { describe, expect, it } from 'vitest';
import type { Course, CourseClass } from '@/types/course';
import { courseSitemapEntries } from '../sitemapBuilder';

describe('courseSitemapEntries', () => {
	it('includes course page and future term query urls', () => {
		const place = {
			id: 'p',
			name: 'Obiekt',
			slug: 'obiekt',
			googleMapsLink: 'https://maps.test',
		};
		const date: CourseClass = {
			id: 'term-1',
			slotsMax: 6,
			date: '2099-05-01',
			timeStart: '10:00',
			participants: [],
			instructor: { id: 'i', name: 'I', slug: 'i', bio: '' },
			place,
		};
		const course: Course = {
			id: 'c',
			name: 'Kurs',
			slug: 'kurs',
			description: 'd',
			price: 1,
			hours: 1,
			tags: [],
			level: 'basic',
			dates: [date],
		};
		const entries = courseSitemapEntries([course]);
		expect(entries.map((e) => e.url)).toEqual(
			expect.arrayContaining([
				'https://szkolenia.glocksklep.pl/szkolenia/kurs',
				expect.stringContaining('termin=term-1'),
			])
		);
	});
});