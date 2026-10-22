import { describe, expect, it } from 'vitest';
import type { CourseDescription } from '@/types/courseDescription';
import { mapParticipantDescription } from './mapParticipantDescription';

const base = (): CourseDescription => ({
	id: 'test',
	slug: 'pistol-basic',
	eyebrow: 'Podstawy',
	headline: ['Pistolet', 'podstawowy'],
	description: 'Lead',
	outcomes: { items: ['Umiejętność A'] },
	forWhom: { items: ['Początkujący'] },
});

describe('mapParticipantDescription', () => {
	it('includes outcomes only when toggled for participant panel', () => {
		expect(mapParticipantDescription(base()).outcomes).toBeUndefined();

		expect(
			mapParticipantDescription({
				...base(),
				visibleInParticipantPanel: ['outcomes'],
			}).outcomes
		).toEqual(['Umiejętność A']);
	});
});
