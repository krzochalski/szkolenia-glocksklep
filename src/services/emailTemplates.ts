import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import type {
	EnrollmentConfirmationTemplate,
	EnrollmentConfirmationWritable,
} from '@/types/emailTemplate';
import { db } from './firestore';

const COLLECTION = 'emailTemplates';
const ENROLLMENT_DOC_ID = 'enrollmentConfirmation';

export const DEFAULT_ENROLLMENT_CONFIRMATION: EnrollmentConfirmationWritable = {
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

const asString = (value: unknown, fallback: string): string =>
	typeof value === 'string' && value.trim() ? value.trim() : fallback;

const normalize = (data: Record<string, unknown> | undefined): EnrollmentConfirmationTemplate => ({
	subject: asString(data?.subject, DEFAULT_ENROLLMENT_CONFIRMATION.subject),
	headline: asString(data?.headline, DEFAULT_ENROLLMENT_CONFIRMATION.headline),
	body: asString(data?.body, DEFAULT_ENROLLMENT_CONFIRMATION.body),
	updatedAt:
		data?.updatedAt && typeof (data.updatedAt as { toDate?: () => Date }).toDate === 'function'
			? (data.updatedAt as { toDate: () => Date }).toDate().toISOString()
			: undefined,
});

export const getEnrollmentConfirmationTemplate =
	async (): Promise<EnrollmentConfirmationTemplate> => {
		const snap = await getDoc(doc(db, COLLECTION, ENROLLMENT_DOC_ID));
		if (!snap.exists()) {
			return { ...DEFAULT_ENROLLMENT_CONFIRMATION };
		}
		return normalize(snap.data());
	};

export const saveEnrollmentConfirmationTemplate = async (
	docData: EnrollmentConfirmationWritable
): Promise<void> => {
	await setDoc(
		doc(db, COLLECTION, ENROLLMENT_DOC_ID),
		{
			subject: docData.subject.trim(),
			headline: docData.headline.trim(),
			body: docData.body.trim(),
			updatedAt: serverTimestamp(),
		},
		{ merge: true }
	);
};

export const seedEnrollmentConfirmationTemplateIfMissing = async (): Promise<boolean> => {
	const ref = doc(db, COLLECTION, ENROLLMENT_DOC_ID);
	const snap = await getDoc(ref);
	if (snap.exists()) return false;
	await setDoc(ref, {
		...DEFAULT_ENROLLMENT_CONFIRMATION,
		updatedAt: serverTimestamp(),
	});
	return true;
};
