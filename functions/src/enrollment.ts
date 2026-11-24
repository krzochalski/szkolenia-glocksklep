import type { Firestore } from 'firebase-admin/firestore';
import { z } from 'zod';
import { getUnenrollEligibility, unenrollBlockedMessage } from './cancellationDeadline';
import { isValidPolishNip, normalizeNip } from './nip';
import { deriveDocumentType } from './salesDocument';

const participantSchema = z
	.object({
		id: z.string().min(1),
		name: z.string().min(1),
		email: z.string().email(),
		phoneNumber: z.string().optional(),
		invoiceNip: z.string().optional(),
		invoiceCompanyName: z.string().optional(),
		invoiceCompanyAddress: z.string().optional(),
	})
	.superRefine((data, ctx) => {
		const nip = data.invoiceNip?.trim();
		if (!nip) return;
		if (!isValidPolishNip(nip)) {
			ctx.addIssue({ code: 'custom', message: 'Nieprawidłowy NIP.', path: ['invoiceNip'] });
		}
		if (!data.invoiceCompanyName?.trim()) {
			ctx.addIssue({
				code: 'custom',
				message: 'Nazwa firmy jest wymagana przy fakturze.',
				path: ['invoiceCompanyName'],
			});
		}
		if (!data.invoiceCompanyAddress?.trim()) {
			ctx.addIssue({
				code: 'custom',
				message: 'Adres firmy jest wymagany przy fakturze.',
				path: ['invoiceCompanyAddress'],
			});
		}
	});

export const enrollBodySchema = z.object({
	courseId: z.string().min(1),
	dateId: z.string().min(1),
	participant: participantSchema,
});

export const unenrollBodySchema = z.object({
	courseId: z.string().min(1),
	dateId: z.string().min(1),
	participantId: z.string().min(1),
});

type CourseDate = {
	id?: string;
	date?: string;
	timeStart?: string;
	canceled?: boolean;
	slotsMax?: number;
	participants?: Array<{
		id: string;
		name: string;
		email: string;
		phoneNumber?: string;
		paid?: boolean;
		paysByCash?: boolean;
		documentType?: string;
		invoiceNip?: string;
		invoiceCompanyName?: string;
		invoiceCompanyAddress?: string;
	}>;
};

type CourseDoc = {
	inactive?: boolean;
	kind?: string;
	prerequisiteCourseIds?: unknown;
	dates?: CourseDate[];
};

export const PREREQUISITE_ENROLL_ERROR =
	'To szkolenie wymaga ukończenia wcześniejszego kursu.';

const matchDate = (d: CourseDate, dateId: string): boolean =>
	d.id === dateId || d.date === dateId;

const getPrerequisiteIds = (course: CourseDoc): string[] => {
	if (course.kind !== 'practice') return [];
	if (!Array.isArray(course.prerequisiteCourseIds)) return [];
	return course.prerequisiteCourseIds.filter(
		(id): id is string => typeof id === 'string' && id.length > 0
	);
};

const buildParticipantRecord = (input: z.infer<typeof participantSchema>) => {
	const nip = input.invoiceNip?.trim();
	const documentType = deriveDocumentType(nip);
	return {
		id: input.id,
		name: input.name,
		email: input.email,
		...(input.phoneNumber ? { phoneNumber: input.phoneNumber } : {}),
		documentType,
		...(nip
			? {
					invoiceNip: normalizeNip(nip),
					invoiceCompanyName: input.invoiceCompanyName!.trim(),
					invoiceCompanyAddress: input.invoiceCompanyAddress!.trim(),
				}
			: {}),
	};
};

export const enrollInCourseTx = async (
	db: Firestore,
	uid: string,
	input: z.infer<typeof enrollBodySchema>
): Promise<void> => {
	if (input.participant.id !== uid) {
		throw new Error('Możesz zapisać tylko siebie.');
	}

	const ref = db.collection('courses').doc(input.courseId);

	await db.runTransaction(async (tx) => {
		const snap = await tx.get(ref);
		if (!snap.exists) throw new Error('Kurs nie istnieje.');
		const course = snap.data() as CourseDoc;
		if (course.inactive) throw new Error('To szkolenie nie jest obecnie dostępne.');

		const prereqs = getPrerequisiteIds(course);
		if (prereqs.length > 0) {
			const completionSnaps = await Promise.all(
				prereqs.map((courseId) =>
					tx.get(db.collection('users').doc(uid).collection('courseCompletions').doc(courseId))
				)
			);
			if (completionSnaps.some((s) => !s.exists)) {
				throw new Error(PREREQUISITE_ENROLL_ERROR);
			}
		}

		const dates = [...(course.dates ?? [])];
		const idx = dates.findIndex((d) => matchDate(d, input.dateId));
		if (idx < 0) throw new Error('Termin nie istnieje.');
		const target = dates[idx];
		if (target.canceled) throw new Error('Ten termin został anulowany.');
		const participants = [...(target.participants ?? [])];
		if (participants.some((p) => p.id === uid)) {
			throw new Error('Już jesteś zapisany na ten termin.');
		}
		const slotsMax = target.slotsMax ?? 0;
		if (participants.length >= slotsMax) {
			throw new Error('Brak wolnych miejsc.');
		}
		participants.push(buildParticipantRecord(input.participant));
		dates[idx] = { ...target, participants };
		tx.update(ref, { dates });
	});

	const waitId = `${input.courseId}_${uid}`;
	const waitRef = db.collection('courseWaitingList').doc(waitId);
	const waitSnap = await waitRef.get();
	if (waitSnap.exists) {
		await waitRef.delete();
	}

	const email = input.participant.email.trim().toLowerCase();
	if (email) {
		const guestWaitId = `${input.courseId}_guest_${email}`;
		const guestRef = db.collection('courseWaitingList').doc(guestWaitId);
		const guestSnap = await guestRef.get();
		if (guestSnap.exists) {
			await guestRef.delete();
		}
	}
};

export const unenrollFromCourseTx = async (
	db: Firestore,
	uid: string,
	input: z.infer<typeof unenrollBodySchema>,
	asAdmin: boolean,
	now: Date = new Date()
): Promise<void> => {
	if (!asAdmin && input.participantId !== uid) {
		throw new Error('Możesz wypisać tylko siebie.');
	}

	const ref = db.collection('courses').doc(input.courseId);

	await db.runTransaction(async (tx) => {
		const snap = await tx.get(ref);
		if (!snap.exists) throw new Error('Kurs nie istnieje.');
		const course = snap.data() as CourseDoc;
		const dates = [...(course.dates ?? [])];
		const idx = dates.findIndex((d) => matchDate(d, input.dateId));
		if (idx < 0) throw new Error('Termin nie istnieje.');
		const target = dates[idx];

		if (!asAdmin) {
			const completionRef = db
				.collection('users')
				.doc(input.participantId)
				.collection('courseCompletions')
				.doc(input.courseId);
			const completionSnap = await tx.get(completionRef);
			const eligibility = getUnenrollEligibility({
				now,
				date: target.date ?? '',
				timeStart: target.timeStart ?? '',
				attendanceMarked: completionSnap.exists,
			});
			if (!eligibility.allowed) {
				throw new Error(unenrollBlockedMessage(eligibility.reason));
			}
		}

		dates[idx] = {
			...target,
			participants: (target.participants ?? []).filter((p) => p.id !== input.participantId),
		};
		tx.update(ref, { dates });
	});
};