import {
	addDoc,
	collection,
	deleteDoc,
	deleteField,
	doc,
	getDoc,
	getDocs,
	query,
	updateDoc,
	where,
	writeBatch,
} from 'firebase/firestore';
import { v4 as uuid } from 'uuid';
import type { Course, Participant } from '@/types/course';
import { stripUndefined } from '@/utils/common';
import { sortCoursesByOrder } from '@/utils/courseOrder';
import { toOptimizedImagePath } from '@/utils/optimizedImagePath';
import type { CourseFormValues } from '@/utils/schemas';
import { auth } from './auth';
import { db } from './firestore';

const normalizeImagePath = (value: string | undefined): string | undefined => {
	const trimmed = value?.trim();
	return trimmed ? toOptimizedImagePath(trimmed) : undefined;
};

const withDateIds = (data: CourseFormValues) => {
	const { thumbnail, hero, inactive, ...rest } = data;
	return stripUndefined({
		...rest,
		thumbnail: normalizeImagePath(thumbnail),
		hero: normalizeImagePath(hero),
		...(inactive ? { inactive: true } : {}),
		dates: (data.dates ?? []).map((d) => ({ ...d, id: uuid(), participants: [] })),
	});
};

export const createCourse = async (data: CourseFormValues): Promise<void> => {
	const existing = await getCourses();
	const maxOrder = existing.reduce((max, c) => Math.max(max, c.order ?? -1), -1);
	await addDoc(collection(db, 'courses'), {
		...withDateIds(data),
		order: maxOrder + 1,
	});
};

export const updateCourse = async (id: string, data: CourseFormValues): Promise<void> => {
	const existing = await getCourse(id);
	// Details-only edits pass dates: [] — keep existing dates untouched.
	const dates =
		data.dates && data.dates.length > 0
			? data.dates.map((d, i) => ({
					...d,
					id: existing?.dates?.[i]?.id ?? uuid(),
					participants: existing?.dates?.[i]?.participants ?? [],
				}))
			: (existing?.dates ?? []);
	const { dates: _dates, thumbnail, hero, inactive, ...rest } = data;
	const thumbnailPath = normalizeImagePath(thumbnail);
	const heroPath = normalizeImagePath(hero);
	await updateDoc(doc(db, 'courses', id), {
		...stripUndefined({ ...rest, dates }),
		thumbnail: thumbnailPath ?? deleteField(),
		hero: heroPath ?? deleteField(),
		inactive: inactive ? true : deleteField(),
	});
};

export const getCourses = async (): Promise<Course[]> => {
	const snap = await getDocs(collection(db, 'courses'));
	return sortCoursesByOrder(
		snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Course)
	);
};

/** Writes contiguous `order` values (0..n-1) for the given course ids. */
export const reorderCourses = async (orderedIds: string[]): Promise<void> => {
	if (orderedIds.length === 0) return;
	const batch = writeBatch(db);
	for (const [index, id] of orderedIds.entries()) {
		batch.update(doc(db, 'courses', id), { order: index });
	}
	await batch.commit();
};

export const getCourse = async (id: string): Promise<Course | null> => {
	const snap = await getDoc(doc(db, 'courses', id));
	if (!snap.exists()) return null;
	return { id: snap.id, ...snap.data() } as Course;
};

export const getCourseBySlug = async (slug: string): Promise<Course | null> => {
	const q = query(collection(db, 'courses'), where('slug', '==', slug));
	const snap = await getDocs(q);
	if (snap.empty) return null;
	const d = snap.docs[0];
	return { id: d.id, ...d.data() } as Course;
};

export const deleteCourse = async (id: string): Promise<void> => {
	await deleteDoc(doc(db, 'courses', id));
};

export const enrollInCourse = async (
	courseId: string,
	dateId: string,
	participant: Participant
): Promise<void> => {
	const user = auth.currentUser;
	if (!user) throw new Error('Brak zalogowanego użytkownika.');
	const token = await user.getIdToken();
	const res = await fetch('/api/enroll', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ courseId, dateId, participant }),
	});
	if (!res.ok) {
		const e = await res.json().catch(() => ({}));
		throw new Error(
			typeof e === 'object' && e !== null && 'error' in e && typeof e.error === 'string'
				? e.error
				: 'Nie udało się zapisać na szkolenie.'
		);
	}
	/* Confirmation email: Cloud Function /api/enroll */
};

export const unenrollFromCourse = async (
	courseId: string,
	dateId: string,
	participantId: string
): Promise<void> => {
	const user = auth.currentUser;
	if (!user) throw new Error('Brak zalogowanego użytkownika.');
	const token = await user.getIdToken();
	const res = await fetch('/api/unenroll', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ courseId, dateId, participantId }),
	});
	if (!res.ok) {
		const e = await res.json().catch(() => ({}));
		throw new Error(
			typeof e === 'object' && e !== null && 'error' in e && typeof e.error === 'string'
				? e.error
				: 'Nie udało się wypisać ze szkolenia.'
		);
	}
};

export const toggleParticipantPaid = async (
	courseId: string,
	dateId: string,
	participantId: string
): Promise<void> => {
	const snap = await getDoc(doc(db, 'courses', courseId));
	if (!snap.exists()) throw new Error('Kurs nie istnieje.');
	const course = { id: snap.id, ...snap.data() } as Course;
	const dates = (course.dates ?? []).map((d) => {
		if (d.id !== dateId && d.date !== dateId) return d;
		return {
			...d,
			participants: (d.participants ?? []).map((p) =>
				p.id === participantId ? { ...p, paid: !p.paid } : p
			),
		};
	});
	await updateDoc(doc(db, 'courses', courseId), { dates });
};

export const setParticipantPaysByCash = async (
	courseId: string,
	dateId: string,
	participantId: string,
	paysByCash: boolean
): Promise<void> => {
	const snap = await getDoc(doc(db, 'courses', courseId));
	if (!snap.exists()) throw new Error('Kurs nie istnieje.');
	const course = { id: snap.id, ...snap.data() } as Course;
	const dates = (course.dates ?? []).map((d) => {
		if (d.id !== dateId && d.date !== dateId) return d;
		return {
			...d,
			participants: (d.participants ?? []).map((p) =>
				p.id === participantId ? { ...p, paysByCash } : p
			),
		};
	});
	await updateDoc(doc(db, 'courses', courseId), { dates });
};

/**
 * Replaces the entire `dates` array on a course document.
 * Used by admin pages to add, remove, clone, or reorder dates.
 */
export const updateCourseDates = async (
	courseId: string,
	dates: Record<string, unknown>[]
): Promise<void> => {
	const cleanDates = stripUndefined(dates);
	await updateDoc(doc(db, 'courses', courseId), { dates: cleanDates });
};

export const setCourseDateCanceled = async (
	courseId: string,
	dateId: string,
	canceled: boolean
): Promise<void> => {
	const snap = await getDoc(doc(db, 'courses', courseId));
	if (!snap.exists()) throw new Error('Kurs nie istnieje.');
	const course = { id: snap.id, ...snap.data() } as Course;
	const dates = (course.dates ?? []).map((d) =>
		d.id === dateId ? { ...d, canceled: canceled || undefined } : d
	);
	await updateDoc(doc(db, 'courses', courseId), { dates: stripUndefined(dates) });
};

/** Admin-only client enroll (Firestore rules require admins/{uid}). */
export const adminEnrollParticipant = async (
	courseId: string,
	dateId: string,
	participant: Participant
): Promise<void> => {
	const snap = await getDoc(doc(db, 'courses', courseId));
	if (!snap.exists()) throw new Error('Kurs nie istnieje.');
	const course = { id: snap.id, ...snap.data() } as Course;
	const dates = (course.dates ?? []).map((d) => {
		if (d.id !== dateId && d.date !== dateId) return d;
		if (d.canceled) throw new Error('Ten termin został anulowany.');
		const already = d.participants?.some((p) => p.id === participant.id);
		if (already) return d;
		const slotsMax = d.slotsMax ?? 0;
		const count = d.participants?.length ?? 0;
		if (count >= slotsMax) throw new Error('Brak wolnych miejsc.');
		return {
			...d,
			participants: [
				...(d.participants ?? []),
				stripUndefined({
					id: participant.id,
					name: participant.name,
					email: participant.email,
					phoneNumber: participant.phoneNumber,
				}),
			],
		};
	});
	await updateDoc(doc(db, 'courses', courseId), { dates: stripUndefined(dates) });

	const user = auth.currentUser;
	if (user && participant.email) {
		try {
			const token = await user.getIdToken();
			await fetch('/api/notify-enrollment', {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					courseId,
					dateId,
					participant: { name: participant.name, email: participant.email },
				}),
			});
		} catch {
			/* Enrollment already succeeded. */
		}
	}
};
