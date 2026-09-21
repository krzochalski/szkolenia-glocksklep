import type { Firestore } from 'firebase-admin/firestore';
import { z } from 'zod';

const participantSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	email: z.string().email(),
	phoneNumber: z.string().optional(),
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
	canceled?: boolean;
	slotsMax?: number;
	participants?: Array<{
		id: string;
		name: string;
		email: string;
		phoneNumber?: string;
		paid?: boolean;
		paysByCash?: boolean;
	}>;
};

type CourseDoc = {
	dates?: CourseDate[];
};

const matchDate = (d: CourseDate, dateId: string): boolean =>
	d.id === dateId || d.date === dateId;

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
		participants.push({
			id: input.participant.id,
			name: input.participant.name,
			email: input.participant.email,
			...(input.participant.phoneNumber
				? { phoneNumber: input.participant.phoneNumber }
				: {}),
		});
		dates[idx] = { ...target, participants };
		tx.update(ref, { dates });
	});

	const waitId = `${input.courseId}_${uid}`;
	const waitRef = db.collection('courseWaitingList').doc(waitId);
	const waitSnap = await waitRef.get();
	if (waitSnap.exists) {
		await waitRef.delete();
	}
};

export const unenrollFromCourseTx = async (
	db: Firestore,
	uid: string,
	input: z.infer<typeof unenrollBodySchema>,
	asAdmin: boolean
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
		dates[idx] = {
			...target,
			participants: (target.participants ?? []).filter((p) => p.id !== input.participantId),
		};
		tx.update(ref, { dates });
	});
};
