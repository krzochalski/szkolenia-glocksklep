import { describe, expect, it } from 'vitest';

import type { Participant } from '@/types/course';
import {
	paragonIssueBlockReason,
	paragonIssueBlockTooltip,
	resolveParagonPanelChip,
} from './paragonAdmin';

const base: Participant = {
	id: 'p1',
	name: 'Jan',
	email: 'jan@example.com',
	paid: true,
	documentType: 'receipt',
};

describe('resolveParagonPanelChip', () => {
	it('returns none without receipt', () => {
		expect(resolveParagonPanelChip(base, null)).toBe('none');
	});

	it('returns issuing when lock active', () => {
		expect(
			resolveParagonPanelChip(
				{
					...base,
					fakturownia: { status: 'issuing', issuingAt: new Date().toISOString() },
				},
				null
			)
		).toBe('issuing');
	});

	it('returns printed when fiscalStatus printed', () => {
		expect(
			resolveParagonPanelChip(
				{
					...base,
					fakturownia: {
						receiptId: 1,
						number: 'P/1',
						viewUrl: 'https://x',
						createdAt: '2026-01-01',
					},
					fiscalStatus: 'printed',
				},
				'printed'
			)
		).toBe('printed');
	});
});

describe('paragonIssueBlockReason', () => {
	it('blocks unpaid', () => {
		expect(paragonIssueBlockReason({ ...base, paid: false }, 400)).toBe('unpaid');
		expect(paragonIssueBlockTooltip('unpaid')).toContain('opłaconego');
	});
});