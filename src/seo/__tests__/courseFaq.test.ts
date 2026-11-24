import { describe, expect, it } from 'vitest';
import type { Course } from '@/types/course';
import { buildCourseFaqItems } from '../courseFaq';

const course: Course = {
	id: '1',
	name: 'Test',
	slug: 'movement-fundamentals',
	description: 'd',
	price: 100,
	hours: 4,
	tags: [],
	level: 'basic',
};

describe('buildCourseFaqItems', () => {
	it('merges slug-specific Firestore items with defaults', () => {
		const items = buildCourseFaqItems(course, [
			{
				id: 'x',
				question: 'Pytanie dedykowane',
				answer: 'Odpowiedź',
				order: 0,
				courseSlugs: ['movement-fundamentals'],
			},
		]);
		expect(items[0]?.title).toBe('Pytanie dedykowane');
		expect(items.some((i) => i.content.includes('Wielkopolsce'))).toBe(true);
	});
});