import { describe, expect, it } from 'vitest';
import {
	applyDateNotifyPlaceholders,
	dateNotifyBodySchema,
	findUnknownDateNotifyPlaceholders,
	firstNameFromDisplayName,
	isValidEmailAddress,
	markdownToEmailHtmlFragment,
	markdownToPlaintext,
} from './dateNotifyMail';

describe('dateNotify placeholders', () => {
	const vars = {
		firstName: 'Anna',
		courseName: 'IDPA',
		level: 'Podstawowy',
		date: '10.11.2026',
		time: '09:00',
		location: 'Strzelnica',
		mapLink: 'https://maps.example',
		instructor: 'Piotr',
		requirements: 'kabura',
		price: '123.00 zł brutto',
		paymentStatus: 'opłacone',
		panelLink: 'https://szkolenia.glocksklep.pl/profil',
		minimumInfo: 'min 4',
		cancellationInfo: '3 dni',
		contact: 'E-mail: zamowienia@glocksklep.pl',
	};

	it('substitutes known keys', () => {
		expect(applyDateNotifyPlaceholders('Cześć {{firstName}} — {{courseName}}', vars)).toContain(
			'Anna'
		);
		expect(applyDateNotifyPlaceholders('Cześć {{firstName}} — {{courseName}}', vars)).toContain(
			'IDPA'
		);
	});

	it('finds unknown placeholders', () => {
		expect(findUnknownDateNotifyPlaceholders('{{firstName}} {{nope}}')).toEqual(['nope']);
	});

	it('firstNameFromDisplayName', () => {
		expect(firstNameFromDisplayName('Jan Nowak')).toBe('Jan');
	});
});

describe('dateNotifyBodySchema', () => {
	it('accepts a valid send payload', () => {
		const parsed = dateNotifyBodySchema.safeParse({
			courseId: 'c1',
			dateId: 'd1',
			subject: 'Temat {{courseName}}',
			bodyMarkdown: 'Treść {{firstName}}',
			recipientMode: 'confirmed',
			idempotencyKey: '550e8400-e29b-41d4-a716-446655440000',
		});
		expect(parsed.success).toBe(true);
	});

	it('rejects non-uuid idempotency key', () => {
		const parsed = dateNotifyBodySchema.safeParse({
			courseId: 'c1',
			dateId: 'd1',
			subject: 'Temat',
			bodyMarkdown: 'Treść',
			recipientMode: 'confirmed',
			idempotencyKey: 'not-a-uuid',
		});
		expect(parsed.success).toBe(false);
	});
});

describe('markdown / email helpers', () => {
	it('isValidEmailAddress', () => {
		expect(isValidEmailAddress('a@b.pl')).toBe(true);
		expect(isValidEmailAddress('x')).toBe(false);
	});

	it('markdownToEmailHtmlFragment + plaintext', () => {
		const md = '## Tytuł\n\n- **bold**\n\nTekst';
		const html = markdownToEmailHtmlFragment(md);
		expect(html).toContain('<h3');
		expect(html).toContain('<strong>bold</strong>');
		expect(markdownToPlaintext(md)).toContain('Tytuł');
		expect(markdownToPlaintext(md)).toContain('bold');
	});
});
