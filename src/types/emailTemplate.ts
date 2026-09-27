export type EnrollmentConfirmationTemplate = {
	subject: string;
	headline: string;
	/** Plain-text body; supports {{placeholders}}. Paragraphs separated by blank lines. */
	body: string;
	updatedAt?: string;
};

export type EnrollmentConfirmationWritable = Omit<EnrollmentConfirmationTemplate, 'updatedAt'>;

/** Placeholders available in subject, headline, and body. */
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
