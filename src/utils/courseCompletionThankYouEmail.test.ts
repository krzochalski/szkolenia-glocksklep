import { DEFAULT_COURSE_COMPLETION_THANK_YOU } from '@services/emailTemplates';
import { describe, expect, it } from 'vitest';
import {
	applyCourseCompletionPlaceholders,
	buildCourseCompletionThankYouHtml,
	buildCourseCompletionThankYouSubject,
	buildCourseCompletionThankYouText,
} from './courseCompletionThankYouEmail';

const vars = {
	participantName: 'Ada',
	courseName: 'Pistol Basic',
	materialsUrl: 'https://szkolenia.glocksklep.pl/profil/debriefing/pbc',
	nextPathSteps: '• Target Focus (Umiejętności techniczne)\n• Movement Fundamentals (Umiejętności techniczne)',
	pathUrl: 'https://szkolenia.glocksklep.pl/profil/sciezka-rozwoju',
	trainingsUrl: 'https://szkolenia.glocksklep.pl/najblizsze-szkolenia',
};

describe('courseCompletionThankYouEmail', () => {
	it('applies placeholders in subject', () => {
		expect(buildCourseCompletionThankYouSubject(DEFAULT_COURSE_COMPLETION_THANK_YOU, vars)).toBe(
			'Dziękujemy — Pistol Basic ukończone'
		);
	});

	it('builds html and text with materials and next steps', () => {
		const html = buildCourseCompletionThankYouHtml(DEFAULT_COURSE_COMPLETION_THANK_YOU, vars);
		const text = buildCourseCompletionThankYouText(DEFAULT_COURSE_COMPLETION_THANK_YOU, vars);

		expect(html).toContain('Ada');
		expect(html).toContain('Pistol Basic');
		expect(html).toContain(vars.materialsUrl);
		expect(html).toContain('Target Focus');
		expect(html).toContain('Materiały do nauki');
		expect(text).toContain('Dziękujemy za udział');
		expect(text).toContain(vars.trainingsUrl);
		expect(text).toContain(vars.pathUrl);
	});

	it('leaves unknown placeholders intact', () => {
		expect(applyCourseCompletionPlaceholders('Hi {{unknown}}', vars)).toBe('Hi {{unknown}}');
	});
});
