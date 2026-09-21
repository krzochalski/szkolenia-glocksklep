import type { CourseWaitingListEntry } from '@/types/courseWaitingList';
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
import { db } from './firestore';

export const getWaitingListEntryId = (courseId: string, userId: string): string =>
	`${courseId}_${userId}`;

export const addToWaitingList = async (params: {
	courseId: string;
	courseName: string;
	courseSlug: string;
	userId: string;
	userName: string;
	email: string;
	phoneNumber?: string;
}): Promise<void> => {
	const id = getWaitingListEntryId(params.courseId, params.userId);
	const entry: Omit<CourseWaitingListEntry, 'id'> = {
		courseId: params.courseId,
		courseName: params.courseName,
		courseSlug: params.courseSlug,
		userId: params.userId,
		userName: params.userName,
		email: params.email,
		...(params.phoneNumber ? { phoneNumber: params.phoneNumber } : {}),
		createdAt: new Date().toISOString(),
	};
	await setDoc(doc(db, 'courseWaitingList', id), entry);
};

export const removeFromWaitingList = async (courseId: string, userId: string): Promise<void> => {
	const id = getWaitingListEntryId(courseId, userId);
	const ref = doc(db, 'courseWaitingList', id);
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
	const snap = await getDoc(doc(db, 'courseWaitingList', getWaitingListEntryId(courseId, userId)));
	if (!snap.exists()) return null;
	return { id: snap.id, ...snap.data() } as CourseWaitingListEntry;
};

export const getUserWaitingListEntries = async (
	userId: string
): Promise<CourseWaitingListEntry[]> => {
	const q = query(collection(db, 'courseWaitingList'), where('userId', '==', userId));
	const snap = await getDocs(q);
	return snap.docs
		.map((d) => ({ id: d.id, ...d.data() }) as CourseWaitingListEntry)
		.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

export const adminGetWaitingListEntries = async (): Promise<CourseWaitingListEntry[]> => {
	const q = query(collection(db, 'courseWaitingList'), orderBy('createdAt', 'desc'));
	const snap = await getDocs(q);
	return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CourseWaitingListEntry);
};

export const adminRemoveFromWaitingList = async (entryId: string): Promise<void> => {
	await deleteDoc(doc(db, 'courseWaitingList', entryId));
};
