import { describe, expect, it } from 'vitest';
import {
	resolveCourseHero,
	resolveCourseHeroFrom,
	resolveCourseThumbnail,
	resolveCourseThumbnailFrom,
} from './courseImages';

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
		expect(resolveCourseThumbnail({ background: '/hero/idpa_competition.webp' })).toBe(
			'/hero/idpa_competition.webp'
		);
		expect(resolveCourseHero({ hero: '/hero/ipsc_class.webp' })).toBe('/hero/ipsc_class.webp');
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

	it('prefers course paths over description', () => {
		expect(
			resolveCourseThumbnailFrom(
				{ thumbnail: '/thumbnails/a.webp' },
				{ thumbnail: '/hero/b.webp', background: '/hero/c.webp' }
			)
		).toBe('/thumbnails/a.webp');
		expect(
			resolveCourseHeroFrom({ hero: '/hero/a.webp' }, { hero: '/hero/b.webp', background: '/hero/c.webp' })
		).toBe('/hero/a.webp');
	});

	it('falls back to description when course has no image', () => {
		expect(
			resolveCourseThumbnailFrom({ thumbnail: '' }, { thumbnail: '/thumbnails/d.webp' })
		).toBe('/thumbnails/d.webp');
		expect(resolveCourseHeroFrom(null, { hero: '/hero/e.webp' })).toBe('/hero/e.webp');
	});
});
