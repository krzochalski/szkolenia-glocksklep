import { describe, expect, it } from 'vitest';
import {
	buildWaitingListConfirmationHtml,
	buildWaitingListConfirmationSubject,
	buildWaitingListConfirmationText,
} from './waitingListConfirmationEmail';

const input = {
	courseName: 'Pistol Basic Course',
	courseSlug: 'pistol-basic-course',
	recipientEmail: 'ada@example.com',
};

describe('waitingListConfirmationEmail', () => {
	it('builds subject with course name', () => {
		expect(buildWaitingListConfirmationSubject(input.courseName)).toBe(
			'Lista oczekujących — Pistol Basic Course'
		);
	});

	it('thanks for signup and clarifies not newsletter', () => {
		const html = buildWaitingListConfirmationHtml(input);
		const text = buildWaitingListConfirmationText(input);

		expect(html).toContain('Dziękujemy za zapis');
		expect(html).toContain('Pistol Basic Course');
		expect(html).toContain('newsletter glocksklep.pl');
		expect(html).toContain('/szkolenia/pistol-basic-course');

		expect(text).toContain('Dziękujemy za zapis');
		expect(text).toContain('Nie zapisujesz się na newsletter glocksklep.pl');
		expect(text).toContain('https://szkolenia.glocksklep.pl/szkolenia/pistol-basic-course');
	});

	it('escapes HTML in course name', () => {
		const html = buildWaitingListConfirmationHtml({
			...input,
			courseName: 'Test <script>alert(1)</script>',
		});
		expect(html).not.toContain('<script>');
		expect(html).toContain('&lt;script&gt;');
	});
});
