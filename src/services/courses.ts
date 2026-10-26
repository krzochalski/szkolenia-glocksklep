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
import type { Course, CourseKind, Participant } from '@/types/course';
import { stripUndefined } from '@/utils/common';
import { getCourseKind } from '@/utils/courseKind';
import { sortCoursesByOrder } from '@/utils/courseOrder';
import { toOptimizedImagePath } from '@/utils/optimizedImagePath';
import type { CourseFormValues } from '@/utils/schemas';
import { auth } from './auth';
import { db } from './firestore';

const normalizeImagePath = (value: string | undefined): string | undefined => {
	const trimmed = value?.trim();
	return trimmed ? toOptimizedImagePath(trimmed) : undefined;
};

const mapCourseDoc = (id: string, data: Record<string, unknown>): Course => {
	const kind: CourseKind = data.kind === 'practice' ? 'practice' : 'course';
	const rawPrereqs = Array.isArray(data.prerequisiteCourseIds)
		? data.prerequisiteCourseIds.filter((x): x is string => typeof x === 'string' && x.length > 0)
		: [];
	const { kind: _k, prerequisiteCourseIds: _p, ...rest } = data;
	return {
		...(rest as Omit<Course, 'id' | 'kind' | 'prerequisiteCourseIds'>),
		id,
		kind,
		prerequisiteCourseIds: kind === 'practice' ? rawPrereqs : [],
	};
};

const withDateIds = (data: CourseFormValues) => {
	const { thumbnail, hero, inactive, kind, prerequisiteCourseIds, ...rest } = data;
	const resolvedKind = getCourseKind({ kind });
	return stripUndefined({
		...rest,
		kind: resolvedKind,
		prerequisiteCourseIds: resolvedKind === 'practice' ? (prerequisiteCourseIds ?? []) : [],
		thumbnail: normalizeImagePath(thumbnail),
		hero: normalizeImagePath(hero),
		...(inactive ? { inactive: true } : {}),
		dates: (data.dates ?? []).map((d) => {
			const subtitle = d.subtitle?.trim();
			return {
				...d,
				id: uuid(),
				participants: [],
				...(subtitle ? { subtitle } : { subtitle: undefined }),
			};
		}),
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
	const { dates: _dates, thumbnail, hero, inactive, kind, prerequisiteCourseIds, ...rest } = data;
	const resolvedKind = getCourseKind({ kind });
	const thumbnailPath = normalizeImagePath(thumbnail);
	const heroPath = normalizeImagePath(hero);
	await updateDoc(doc(db, 'courses', id), {
		...stripUndefined({
			...rest,
			kind: resolvedKind,
			prerequisiteCourseIds: resolvedKind === 'practice' ? (prerequisiteCourseIds ?? []) : [],
			dates,
		}),
		thumbnail: thumbnailPath ?? deleteField(),
		hero: heroPath ?? deleteField(),
		inactive: inactive ? true : deleteField(),
		/** Legacy course-level podtytuł — now lives on dates. */
		subtitle: deleteField(),
	});
};

export const getCourses = async (): Promise<Course[]> => {
	const snap = await getDocs(collection(db, 'courses'));
	return sortCoursesByOrder(snap.docs.map((d) => mapCourseDoc(d.id, d.data())));
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
	return mapCourseDoc(snap.id, snap.data());
};

export const getCourseBySlug = async (slug: string): Promise<Course | null> => {
	const q = query(collection(db, 'courses'), where('slug', '==', slug));
	const snap = await getDocs(q);
	if (snap.empty) return null;
	const d = snap.docs[0];
	return mapCourseDoc(d.id, d.data());
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

export type SetParticipantCustomPriceInput = {
	/** PLN netto; `null` clears the override (keeps audit fields). */
	readonly customPrice: number | null;
	readonly note?: string;
};

/**
 * Sets or clears a per-signup custom price (PLN netto).
 * Clear removes `customPrice` + `customPriceNote` but still stamps audit fields.
 */
export const setParticipantCustomPrice = async (
	courseId: string,
	dateId: string,
	participantId: string,
	input: SetParticipantCustomPriceInput
): Promise<void> => {
	const admin = auth.currentUser;
	if (!admin) throw new Error('Brak zalogowanego użytkownika.');
	const snap = await getDoc(doc(db, 'courses', courseId));
	if (!snap.exists()) throw new Error('Kurs nie istnieje.');
	const course = { id: snap.id, ...snap.data() } as Course;
	const now = new Date().toISOString();
	const note = input.note?.trim() || undefined;
	const dates = (course.dates ?? []).map((d) => {
		if (d.id !== dateId && d.date !== dateId) return d;
		return {
			...d,
			participants: (d.participants ?? []).map((p) => {
				if (p.id !== participantId) return p;
				if (input.customPrice === null) {
					const next: Participant = {
						id: p.id,
						name: p.name,
						email: p.email,
						customPriceUpdatedAt: now,
						customPriceUpdatedBy: admin.uid,
					};
					if (p.phoneNumber) next.phoneNumber = p.phoneNumber;
					if (p.paid != null) next.paid = p.paid;
					if (p.paysByCash != null) next.paysByCash = p.paysByCash;
					return next;
				}
				const next: Participant = {
					...p,
					customPrice: input.customPrice,
					customPriceUpdatedAt: now,
					customPriceUpdatedBy: admin.uid,
				};
				if (note) next.customPriceNote = note;
				else delete next.customPriceNote;
				return next;
			}),
		};
	});
	await updateDoc(doc(db, 'courses', courseId), { dates: stripUndefined(dates) });
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

/**
 * Admin confirms the date will run despite being below minParticipants.
 * Explicit action only — never set automatically.
 */
export const setCourseDateRunConfirmed = async (
	courseId: string,
	dateId: string,
	runConfirmed: boolean
): Promise<void> => {
	const snap = await getDoc(doc(db, 'courses', courseId));
	if (!snap.exists()) throw new Error('Kurs nie istnieje.');
	const course = { id: snap.id, ...snap.data() } as Course;
	const dates = (course.dates ?? []).map((d) =>
		d.id === dateId
			? { ...d, runConfirmedDespiteMin: runConfirmed ? true : undefined }
			: d
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
