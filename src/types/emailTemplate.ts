export type EmailTemplateFields = {
	subject: string;
	headline: string;
	/** Plain-text body; supports {{placeholders}}. Paragraphs separated by blank lines. */
	body: string;
	updatedAt?: string;
};

export type EmailTemplateWritable = Omit<EmailTemplateFields, 'updatedAt'>;

/** @deprecated Prefer EmailTemplateFields — kept for existing imports. */
export type EnrollmentConfirmationTemplate = EmailTemplateFields;

/** @deprecated Prefer EmailTemplateWritable. */
export type EnrollmentConfirmationWritable = EmailTemplateWritable;

export const EMAIL_TEMPLATE_IDS = [
	'enrollmentConfirmation',
	'courseCompletionThankYou',
] as const;

export type EmailTemplateId = (typeof EMAIL_TEMPLATE_IDS)[number];

/** Placeholders available in enrollment subject, headline, and body. */
export const ENROLLMENT_EMAIL_PLACEHOLDERS = [
	'participantName',
	'courseName',
	'date',
	'timeStart',
	'place',
	'courseUrl',
] as const;

export type EnrollmentEmailPlaceholder = (typeof ENROLLMENT_EMAIL_PLACEHOLDERS)[number];

export type EnrollmentEmailVars = Record<EnrollmentEmailPlaceholder, string>;

/** Placeholders available in course-completion thank-you subject, headline, and body. */
export const COURSE_COMPLETION_EMAIL_PLACEHOLDERS = [
	'participantName',
	'courseName',
	'materialsUrl',
	'nextPathSteps',
	'pathUrl',
	'trainingsUrl',
] as const;

export type CourseCompletionEmailPlaceholder =
	(typeof COURSE_COMPLETION_EMAIL_PLACEHOLDERS)[number];

export type CourseCompletionEmailVars = Record<CourseCompletionEmailPlaceholder, string>;

export const EMAIL_TEMPLATE_META: Record<
	EmailTemplateId,
	{ label: string; description: string; placeholders: readonly string[] }
> = {
	enrollmentConfirmation: {
		label: 'Po zapisie',
		description: 'Treść potwierdzenia wysyłanego po zapisie na termin. Placeholdery:',
		placeholders: ENROLLMENT_EMAIL_PLACEHOLDERS,
	},
	courseCompletionThankYou: {
		label: 'Po ukończeniu',
		description:
			'Treść podziękowania wysyłanego, gdy admin oznaczy ukończenie szkolenia. Placeholdery:',
		placeholders: COURSE_COMPLETION_EMAIL_PLACEHOLDERS,
	},
};
