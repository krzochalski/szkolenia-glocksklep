import { describe, expect, it } from 'vitest';

import { findParticipantsNewlyPaid } from './detectPaidTransitions';

describe('findParticipantsNewlyPaid', () => {
	it('detects participant marked paid', () => {
		const before = {
			dates: [
				{
					id: 'd1',
					participants: [{ id: 'u1', paid: false }],
				},
			],
		};
		const after = {
			dates: [
				{
					id: 'd1',
					participants: [{ id: 'u1', paid: true }],
				},
			],
		};
		expect(findParticipantsNewlyPaid(before, after)).toEqual([
			{ dateId: 'd1', participantId: 'u1' },
		]);
	});

	it('ignores already paid', () => {
		const before = {
			dates: [{ id: 'd1', participants: [{ id: 'u1', paid: true }] }],
		};
		const after = {
			dates: [{ id: 'd1', participants: [{ id: 'u1', paid: true }] }],
		};
		expect(findParticipantsNewlyPaid(before, after)).toEqual([]);
	});
});