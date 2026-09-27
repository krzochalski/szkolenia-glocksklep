import { describe, expect, it } from 'vitest';
import { resolveCourseHero, resolveCourseThumbnail } from './courseImages';

describe('courseImages', () => {
	it('prefers thumbnail over legacy background', () => {
		expect(resolveCourseThumbnail({ thumbnail: '/hero/a.webp', background: '/hero/b.webp' })).toBe(
			'/hero/a.webp'
		);
	});

	it('falls back to background for thumbnail', () => {
		expect(resolveCourseThumbnail({ background: '/hero/b.webp' })).toBe('/hero/b.webp');
	});

	it('rewrites legacy png paths to webp', () => {
		expect(resolveCourseThumbnail({ background: '/hero/idpa_competition.png' })).toBe(
			'/hero/idpa_competition.webp'
		);
		expect(resolveCourseHero({ hero: '/hero/ipsc_class.jpg' })).toBe('/hero/ipsc_class.webp');
	});

	it('prefers hero over legacy background', () => {
		expect(resolveCourseHero({ hero: '/hero/a.webp', background: '/hero/b.webp' })).toBe(
			'/hero/a.webp'
		);
	});

	it('returns undefined when no image paths', () => {
		expect(resolveCourseThumbnail({})).toBeUndefined();
		expect(resolveCourseHero({})).toBeUndefined();
	});
});
