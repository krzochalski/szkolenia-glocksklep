import { describe, expect, it } from 'vitest';
import {
	applyWaitlistNotifyPlaceholders,
	isValidEmailAddress,
	waitlistNotifyBodySchema,
} from './waitlistNotifyMail';

describe('applyWaitlistNotifyPlaceholders', () => {
	const vars = {
		participantName: 'Anna',
		imie: 'Anna',
		courseName: 'IDPA',
		courseUrl: 'https://szkolenia.glocksklep.pl/szkolenia/idpa',
	};

	it('replaces known keys including imie alias', () => {
		expect(applyWaitlistNotifyPlaceholders('Cześć {{imie}} — {{courseName}}', vars)).toBe(
			'Cześć Anna — IDPA'
		);
		expect(applyWaitlistNotifyPlaceholders('{{participantName}} {{courseUrl}}', vars)).toBe(
			`Anna ${vars.courseUrl}`
		);
	});

	it('leaves unknown placeholders intact', () => {
		expect(applyWaitlistNotifyPlaceholders('{{foo}}', vars)).toBe('{{foo}}');
	});
});

describe('isValidEmailAddress', () => {
	it('accepts normal emails and rejects empty/invalid', () => {
		expect(isValidEmailAddress('a@b.pl')).toBe(true);
		expect(isValidEmailAddress('')).toBe(false);
		expect(isValidEmailAddress('not-an-email')).toBe(false);
	});
});

describe('waitlistNotifyBodySchema', () => {
	it('requires courseId for course scope', () => {
		const bad = waitlistNotifyBodySchema.safeParse({
			scope: 'course',
			subject: 'Temat',
			body: 'Treść',
		});
		expect(bad.success).toBe(false);

		const good = waitlistNotifyBodySchema.safeParse({
			scope: 'course',
			courseId: 'c1',
			subject: 'Temat',
			body: 'Treść',
		});
		expect(good.success).toBe(true);
	});

	it('allows all without courseId', () => {
		const good = waitlistNotifyBodySchema.safeParse({
			scope: 'all',
			subject: 'Temat',
			body: 'Treść',
		});
		expect(good.success).toBe(true);
	});
});
