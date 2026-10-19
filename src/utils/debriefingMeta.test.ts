import { describe, expect, it } from 'vitest';
import { formatDebriefingMeta, formatDebriefingUpdatedAt } from './debriefingMeta';

describe('formatDebriefingUpdatedAt', () => {
	it('formats a valid ISO timestamp', () => {
		const label = formatDebriefingUpdatedAt('2026-10-19T19:15:00.000Z');
		expect(label).toMatch(/19\.10\.2026/);
	});

	it('returns null for empty/invalid', () => {
		expect(formatDebriefingUpdatedAt(undefined)).toBeNull();
		expect(formatDebriefingUpdatedAt('')).toBeNull();
		expect(formatDebriefingUpdatedAt('not-a-date')).toBeNull();
	});
});

describe('formatDebriefingMeta', () => {
	it('combines version and update date', () => {
		const label = formatDebriefingMeta({
			version: 3,
			updatedAt: '2026-10-19T19:15:00.000Z',
		});
		expect(label).toMatch(/^Wersja 3 · aktualizacja /);
		expect(label).toMatch(/19\.10\.2026/);
	});

	it('handles version-only and date-only', () => {
		expect(formatDebriefingMeta({ version: 2 })).toBe('Wersja 2');
		expect(formatDebriefingMeta({ version: 0, updatedAt: '2026-10-19T12:00:00.000Z' })).toMatch(
			/^Aktualizacja /
		);
		expect(formatDebriefingMeta({ version: 0 })).toBeNull();
	});
});
