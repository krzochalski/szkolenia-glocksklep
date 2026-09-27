import { DEFAULT_ENROLLMENT_CONFIRMATION } from '@services/emailTemplates';
import { describe, expect, it } from 'vitest';
import {
	applyEmailPlaceholders,
	buildEnrollmentConfirmationHtml,
	buildEnrollmentConfirmationSubject,
	buildEnrollmentConfirmationText,
} from './enrollmentConfirmationEmail';

const vars = {
	participantName: 'Ada',
	courseName: 'Pistol Basic',
	date: '2026-10-12',
	timeStart: '10:00',
	place: 'Strzelnica X',
	courseUrl: 'https://szkolenia.glocksklep.pl/szkolenia/pistol-basic-course',
};

describe('enrollmentConfirmationEmail', () => {
	it('applies placeholders in subject', () => {
		expect(buildEnrollmentConfirmationSubject(DEFAULT_ENROLLMENT_CONFIRMATION, vars)).toBe(
			'Potwierdzenie zapisu — Pistol Basic'
		);
	});

	it('builds html and text with course details', () => {
		const html = buildEnrollmentConfirmationHtml(DEFAULT_ENROLLMENT_CONFIRMATION, vars);
		const text = buildEnrollmentConfirmationText(DEFAULT_ENROLLMENT_CONFIRMATION, vars);

		expect(html).toContain('Ada');
		expect(html).toContain('Pistol Basic');
		expect(html).toContain('2026-10-12');
		expect(html).toContain('Strzelnica X');
		expect(text).toContain('Dziękujemy za zapis');
		expect(text).toContain(vars.courseUrl);
	});

	it('leaves unknown placeholders intact', () => {
		expect(applyEmailPlaceholders('Hi {{unknown}}', vars)).toBe('Hi {{unknown}}');
	});
});
