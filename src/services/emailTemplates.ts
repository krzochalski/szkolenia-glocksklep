import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import type {
	EmailTemplateFields,
	EmailTemplateId,
	EmailTemplateWritable,
} from '@/types/emailTemplate';
import { db } from './firestore';

const COLLECTION = 'emailTemplates';

export const DEFAULT_ENROLLMENT_CONFIRMATION: EmailTemplateWritable = {
	subject: 'Potwierdzenie zapisu — {{courseName}}',
	headline: 'Zapis potwierdzony',
	body: [
		'Cześć {{participantName}},',
		'',
		'Dziękujemy za zapis na szkolenie {{courseName}}.',
		'',
		'Termin: {{date}} · {{timeStart}}',
		'Miejsce: {{place}}',
		'',
		'Do zobaczenia na treningu!',
		'',
		'Szczegóły szkolenia: {{courseUrl}}',
	].join('\n'),
};

export const DEFAULT_COURSE_COMPLETION_THANK_YOU: EmailTemplateWritable = {
	subject: 'Dziękujemy — {{courseName}} ukończone',
	headline: 'Dziękujemy za udział',
	body: [
		'Cześć {{participantName}},',
		'',
		'Dziękujemy za udział w szkoleniu {{courseName}}!',
		'',
		'Od teraz masz dostęp do materiałów do samodzielnej nauki (debriefing):',
		'{{materialsUrl}}',
		'',
		'Sugerowane kolejne kroki na ścieżce rozwoju:',
		'{{nextPathSteps}}',
		'',
		'Pełna ścieżka: {{pathUrl}}',
		'',
		'Sprawdź też najbliższe dostępne terminy szkoleń:',
		'{{trainingsUrl}}',
		'',
		'Do zobaczenia na kolejnym treningu!',
	].join('\n'),
};

const DEFAULTS: Record<EmailTemplateId, EmailTemplateWritable> = {
	enrollmentConfirmation: DEFAULT_ENROLLMENT_CONFIRMATION,
	courseCompletionThankYou: DEFAULT_COURSE_COMPLETION_THANK_YOU,
};

const asString = (value: unknown, fallback: string): string =>
	typeof value === 'string' && value.trim() ? value.trim() : fallback;

const normalize = (
	data: Record<string, unknown> | undefined,
	fallback: EmailTemplateWritable
): EmailTemplateFields => ({
	subject: asString(data?.subject, fallback.subject),
	headline: asString(data?.headline, fallback.headline),
	body: asString(data?.body, fallback.body),
	updatedAt:
		data?.updatedAt && typeof (data.updatedAt as { toDate?: () => Date }).toDate === 'function'
			? (data.updatedAt as { toDate: () => Date }).toDate().toISOString()
			: undefined,
});

export const getEmailTemplateDefault = (id: EmailTemplateId): EmailTemplateWritable => ({
	...DEFAULTS[id],
});

export const getEmailTemplate = async (id: EmailTemplateId): Promise<EmailTemplateFields> => {
	const fallback = DEFAULTS[id];
	const snap = await getDoc(doc(db, COLLECTION, id));
	if (!snap.exists()) {
		return { ...fallback };
	}
	return normalize(snap.data(), fallback);
};

export const saveEmailTemplate = async (
	id: EmailTemplateId,
	docData: EmailTemplateWritable
): Promise<void> => {
	await setDoc(
		doc(db, COLLECTION, id),
		{
			subject: docData.subject.trim(),
			headline: docData.headline.trim(),
			body: docData.body.trim(),
			updatedAt: serverTimestamp(),
		},
		{ merge: true }
	);
};

export const seedEmailTemplateIfMissing = async (id: EmailTemplateId): Promise<boolean> => {
	const ref = doc(db, COLLECTION, id);
	const snap = await getDoc(ref);
	if (snap.exists()) return false;
	await setDoc(ref, {
		...DEFAULTS[id],
		updatedAt: serverTimestamp(),
	});
	return true;
};

export const seedAllEmailTemplatesIfMissing = async (): Promise<void> => {
	await Promise.all([
		seedEmailTemplateIfMissing('enrollmentConfirmation'),
		seedEmailTemplateIfMissing('courseCompletionThankYou'),
	]);
};

/** @deprecated Prefer getEmailTemplate('enrollmentConfirmation'). */
export const getEnrollmentConfirmationTemplate = (): Promise<EmailTemplateFields> =>
	getEmailTemplate('enrollmentConfirmation');

/** @deprecated Prefer saveEmailTemplate('enrollmentConfirmation', …). */
export const saveEnrollmentConfirmationTemplate = (docData: EmailTemplateWritable): Promise<void> =>
	saveEmailTemplate('enrollmentConfirmation', docData);

/** @deprecated Prefer seedEmailTemplateIfMissing('enrollmentConfirmation'). */
export const seedEnrollmentConfirmationTemplateIfMissing = (): Promise<boolean> =>
	seedEmailTemplateIfMissing('enrollmentConfirmation');
