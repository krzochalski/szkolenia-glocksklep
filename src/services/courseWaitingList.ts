import {
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	orderBy,
	query,
	setDoc,
	where,
} from 'firebase/firestore';
import type { Course } from '@/types/course';
import type { CourseWaitingListEntry } from '@/types/courseWaitingList';
import {
	getPrerequisiteCourseIds,
	isEligibleForCourse,
	PREREQUISITE_ENROLL_ERROR,
} from '@/utils/courseKind';
import { db } from './firestore';

const COLLECTION = 'courseWaitingList';

export const normalizeWaitingListEmail = (email: string): string => email.trim().toLowerCase();

export const getWaitingListEntryId = (courseId: string, userId: string): string =>
	`${courseId}_${userId}`;

export const getGuestWaitingListEntryId = (courseId: string, email: string): string =>
	`${courseId}_guest_${normalizeWaitingListEmail(email)}`;

const loadCourseForGate = async (courseId: string): Promise<Course> => {
	const snap = await getDoc(doc(db, 'courses', courseId));
	if (!snap.exists()) throw new Error('Kurs nie istnieje.');
	const data = snap.data();
	const kind = data.kind === 'practice' ? 'practice' : 'course';
	const prerequisiteCourseIds = Array.isArray(data.prerequisiteCourseIds)
		? data.prerequisiteCourseIds.filter((x): x is string => typeof x === 'string' && x.length > 0)
		: [];
	return {
		id: snap.id,
		...(data as Omit<Course, 'id' | 'kind' | 'prerequisiteCourseIds'>),
		kind,
		prerequisiteCourseIds: kind === 'practice' ? prerequisiteCourseIds : [],
	};
};

const assertUserEligibleForWaitlist = async (courseId: string, userId: string): Promise<void> => {
	const course = await loadCourseForGate(courseId);
	const prereqs = getPrerequisiteCourseIds(course);
	if (prereqs.length === 0) return;
	const snaps = await Promise.all(
		prereqs.map((id) => getDoc(doc(db, 'users', userId, 'courseCompletions', id)))
	);
	const completedIds = new Set(snaps.filter((s) => s.exists()).map((s) => s.id));
	if (!isEligibleForCourse(course, completedIds)) {
		throw new Error(PREREQUISITE_ENROLL_ERROR);
	}
};

export const addToWaitingList = async (params: {
	courseId: string;
	courseName: string;
	courseSlug: string;
	userId: string;
	userName: string;
	email: string;
	phoneNumber?: string;
}): Promise<void> => {
	await assertUserEligibleForWaitlist(params.courseId, params.userId);
	const id = getWaitingListEntryId(params.courseId, params.userId);
	const email = normalizeWaitingListEmail(params.email);
	const entry: Omit<CourseWaitingListEntry, 'id'> = {
		courseId: params.courseId,
		courseName: params.courseName,
		courseSlug: params.courseSlug,
		userId: params.userId,
		userName: params.userName,
		email,
		...(params.phoneNumber ? { phoneNumber: params.phoneNumber } : {}),
		createdAt: new Date().toISOString(),
	};
	await setDoc(doc(db, COLLECTION, id), entry);
	/* Confirmation email: Cloud Function onWaitingListCreated */
};

/** Unauthenticated waitlist signup by email only. */
export const addGuestToWaitingList = async (params: {
	courseId: string;
	courseName: string;
	courseSlug: string;
	email: string;
}): Promise<void> => {
	const course = await loadCourseForGate(params.courseId);
	if (getPrerequisiteCourseIds(course).length > 0) {
		throw new Error(
			'Ten trening wymaga ukończenia wcześniejszego kursu. Zaloguj się na konto z ukończonym szkoleniem.'
		);
	}
	const email = normalizeWaitingListEmail(params.email);
	const id = getGuestWaitingListEntryId(params.courseId, email);
	const entry: Omit<CourseWaitingListEntry, 'id' | 'userId' | 'phoneNumber'> = {
		courseId: params.courseId,
		courseName: params.courseName,
		courseSlug: params.courseSlug,
		userName: 'Gość',
		email,
		guest: true,
		createdAt: new Date().toISOString(),
	};
	await setDoc(doc(db, COLLECTION, id), entry);
	/* Confirmation email: Cloud Function onWaitingListCreated */
};

export const removeFromWaitingList = async (courseId: string, userId: string): Promise<void> => {
	const id = getWaitingListEntryId(courseId, userId);
	const ref = doc(db, COLLECTION, id);
	const snap = await getDoc(ref);
	if (snap.exists()) {
		await deleteDoc(ref);
	}
};

export const isOnWaitingList = async (courseId: string, userId: string): Promise<boolean> => {
	const entry = await getWaitingListEntry(courseId, userId);
	return entry !== null;
};

export const getWaitingListEntry = async (
	courseId: string,
	userId: string
): Promise<CourseWaitingListEntry | null> => {
	const snap = await getDoc(doc(db, COLLECTION, getWaitingListEntryId(courseId, userId)));
	if (!snap.exists()) return null;
	return { id: snap.id, ...snap.data() } as CourseWaitingListEntry;
};

export const getUserWaitingListEntries = async (
	userId: string
): Promise<CourseWaitingListEntry[]> => {
	const q = query(collection(db, COLLECTION), where('userId', '==', userId));
	const snap = await getDocs(q);
	return snap.docs
		.map((d) => ({ id: d.id, ...d.data() }) as CourseWaitingListEntry)
		.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

export const adminGetWaitingListEntries = async (): Promise<CourseWaitingListEntry[]> => {
	const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
	const snap = await getDocs(q);
	return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CourseWaitingListEntry);
};

export const adminRemoveFromWaitingList = async (entryId: string): Promise<void> => {
	await deleteDoc(doc(db, COLLECTION, entryId));
};
