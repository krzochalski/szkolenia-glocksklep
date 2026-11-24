import { describe, expect, it } from 'vitest';
import type { Course } from '@/types/course';
import { pickRelatedCourses } from '../relatedCourses';

const mk = (id: string, slug: string, level: Course['level'], tags: string[] = []): Course => ({
	id,
	name: slug,
	slug,
	description: 'd',
	price: 1,
	hours: 1,
	tags,
	level,
});

describe('pickRelatedCourses', () => {
	it('prefers same level and shared tags', () => {
		const current = mk('1', 'a', 'basic', ['ipsc']);
		const catalog = [
			current,
			mk('2', 'b', 'advanced', ['idpa']),
			mk('3', 'c', 'basic', ['ipsc']),
		];
		const related = pickRelatedCourses(current, catalog);
		expect(related[0]?.slug).toBe('c');
	});
});