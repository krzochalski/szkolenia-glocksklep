import { describe, expect, it } from 'vitest';
import type { CourseDescription } from '@/types/courseDescription';
import { mapParticipantDescription } from './mapParticipantDescription';

const baseDescription = {
	id: 'desc-1',
	slug: 'test-course',
	eyebrow: 'Core',
	headline: ['Test', 'Course'] as [string, string],
	description: 'Lead text',
	modules: [{ icon: 'gps', title: 'Mod A', desc: 'Desc A' }],
	forWhom: { heading: 'Dla kogo', items: ['Beginners'] },
	notExpect: { items: ['Theory only'] },
	bring: { items: ['Gun'] },
	dontBring: { items: ['Phone'] },
} satisfies CourseDescription;

describe('mapParticipantDescription', () => {
	it('returns no sections when visibleInParticipantPanel is empty', () => {
		const result = mapParticipantDescription({
			...baseDescription,
			visibleInParticipantPanel: [],
		});
		expect(result.modules).toBeUndefined();
		expect(result.forWhom).toBeUndefined();
		expect(result.notExpect).toBeUndefined();
		expect(result.bring).toBeUndefined();
		expect(result.dontBring).toBeUndefined();
	});

	it('keeps only enabled sections', () => {
		const result = mapParticipantDescription({
			...baseDescription,
			visibleInParticipantPanel: ['forWhom', 'bring'],
		});
		expect(result.forWhom).toEqual(['Beginners']);
		expect(result.forWhomHeading).toBe('Dla kogo');
		expect(result.bring).toEqual(['Gun']);
		expect(result.modules).toBeUndefined();
		expect(result.notExpect).toBeUndefined();
		expect(result.dontBring).toBeUndefined();
	});

	it('includes modules when enabled', () => {
		const result = mapParticipantDescription({
			...baseDescription,
			visibleInParticipantPanel: ['modules'],
		});
		expect(result.modules).toHaveLength(1);
		expect(result.modules?.[0]?.title).toBe('Mod A');
	});
});
