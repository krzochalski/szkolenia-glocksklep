import { describe, expect, it } from 'vitest';
import type { DevelopmentPathDocument } from '@/types/developmentPath';
import {
	findCoursePathPlacement,
	findNextPathStep,
	formatCoursePathPlacement,
} from './pathProgress';

const pathDoc: DevelopmentPathDocument = {
	intro: '',
	paths: [
		{
			id: 't1',
			title: 'Techniczna',
			levels: [
				{
					id: 'l1',
					items: [
						{ id: 's1', courseSlug: 'podstawy' },
						{ id: 's2', courseSlug: 'ruch', label: 'Ruch' },
					],
				},
				{
					id: 'l2',
					items: [{ id: 's3', courseSlug: 'zaawansowane' }],
				},
			],
		},
		{
			id: 't2',
			title: 'Miękkie',
			levels: [
				{
					id: 'l3',
					items: [{ id: 's4', courseSlug: 'stres' }],
				},
			],
		},
	],
};

describe('findNextPathStep', () => {
	it('returns null when path is missing or empty', () => {
		expect(findNextPathStep(null, new Set())).toBeNull();
		expect(findNextPathStep({ intro: '', paths: [] }, new Set())).toBeNull();
	});

	it('returns the first incomplete step', () => {
		expect(findNextPathStep(pathDoc, new Set())).toEqual({
			courseSlug: 'podstawy',
			label: undefined,
			trackTitle: 'Techniczna',
		});
		expect(findNextPathStep(pathDoc, new Set(['podstawy']))).toEqual({
			courseSlug: 'ruch',
			label: 'Ruch',
			trackTitle: 'Techniczna',
		});
		expect(findNextPathStep(pathDoc, new Set(['podstawy', 'ruch']))).toEqual({
			courseSlug: 'zaawansowane',
			label: undefined,
			trackTitle: 'Techniczna',
		});
	});

	it('moves to the next track when the first is complete', () => {
		expect(
			findNextPathStep(
				pathDoc,
				new Set(['podstawy', 'ruch', 'zaawansowane'])
			)
		).toEqual({
			courseSlug: 'stres',
			label: undefined,
			trackTitle: 'Miękkie',
		});
	});

	it('returns null when every step is completed', () => {
		expect(
			findNextPathStep(
				pathDoc,
				new Set(['podstawy', 'ruch', 'zaawansowane', 'stres'])
			)
		).toBeNull();
	});
});

describe('findCoursePathPlacement', () => {
	it('returns null when course is missing from the path', () => {
		expect(findCoursePathPlacement(pathDoc, 'nieistniejacy')).toBeNull();
		expect(findCoursePathPlacement(null, 'podstawy')).toBeNull();
	});

	it('returns track title and 1-based ordinal within that track', () => {
		expect(findCoursePathPlacement(pathDoc, 'ruch')).toEqual({
			trackTitle: 'Techniczna',
			stepIndex: 2,
			stepTotal: 3,
		});
		expect(findCoursePathPlacement(pathDoc, 'stres')).toEqual({
			trackTitle: 'Miękkie',
			stepIndex: 1,
			stepTotal: 1,
		});
	});

	it('formats a compact fact label', () => {
		expect(
			formatCoursePathPlacement({
				trackTitle: 'Umiejętności techniczne',
				stepIndex: 2,
				stepTotal: 4,
			})
		).toBe('02/04 · Umiejętności techniczne');
	});
});
