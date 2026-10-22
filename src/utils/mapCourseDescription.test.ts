import { describe, expect, it } from 'vitest';
import type { CourseDescription } from '@/types/courseDescription';
import { mapDescriptionToSchema } from './mapCourseDescription';

const base = (): CourseDescription => ({
	id: 'test',
	slug: 'pistol-basic',
	eyebrow: 'Podstawy',
	headline: ['Pistolet', 'podstawowy'],
	description: 'Lead',
});

describe('mapDescriptionToSchema', () => {
	it('maps requirements only when at least one fact is set', () => {
		expect(
			mapDescriptionToSchema({
				...base(),
				requirements: { ownGun: false, holster: false },
			}).requirements
		).toBeUndefined();

		expect(
			mapDescriptionToSchema({
				...base(),
				requirements: { ownGun: true, holster: false, roundCount: 300 },
			}).requirements
		).toEqual({ ownGun: true, holster: false, roundCount: 300 });
	});

	it('maps outcomes section', () => {
		const schema = mapDescriptionToSchema({
			...base(),
			outcomes: { heading: 'Po kursie', items: ['Strzał z kabury', 'Reset'] },
		});
		expect(schema.outcomes).toEqual(['Strzał z kabury', 'Reset']);
		expect(schema.outcomesHeading).toBe('Po kursie');
	});

	it('normalizes gallery to max 3 webp paths', () => {
		const schema = mapDescriptionToSchema({
			...base(),
			gallery: [
				'/sessions/a.jpg',
				'/sessions/b.webp',
				'/sessions/c.png',
				'/sessions/d.webp',
			],
		});
		expect(schema.gallery).toEqual([
			'/sessions/a.webp',
			'/sessions/b.webp',
			'/sessions/c.webp',
		]);
	});

	it('keeps sessionVideoUrl only when YouTube id parses', () => {
		expect(
			mapDescriptionToSchema({
				...base(),
				sessionVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
			}).sessionVideoUrl
		).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');

		expect(
			mapDescriptionToSchema({
				...base(),
				sessionVideoUrl: 'https://example.com/not-youtube',
			}).sessionVideoUrl
		).toBeUndefined();
	});
});
