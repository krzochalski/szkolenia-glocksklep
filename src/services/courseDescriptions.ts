import type { CourseDescription } from '@/types/courseDescription';
import {
	collection,
	deleteDoc,
	deleteField,
	doc,
	getDoc,
	getDocs,
	query,
	setDoc,
	updateDoc,
	where,
} from 'firebase/firestore';
import { db } from './firestore';

const COLLECTION = 'courseDescriptions';

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
	if (typeof value !== 'object' || value === null) return false;
	const proto = Object.getPrototypeOf(value);
	return proto === Object.prototype || proto === null;
};

const stripUndefined = <T>(value: T): T => {
	if (Array.isArray(value)) {
		return value.filter((item) => item !== undefined).map((item) => stripUndefined(item)) as T;
	}

	if (isPlainObject(value)) {
		return Object.fromEntries(
			Object.entries(value)
				.filter(([, v]) => v !== undefined)
				.map(([key, v]) => [key, stripUndefined(v)])
		) as T;
	}

	return value;
};

export const getCourseDescriptions = async (): Promise<CourseDescription[]> => {
	const snap = await getDocs(collection(db, COLLECTION));
	return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CourseDescription);
};

export const getCourseDescription = async (id: string): Promise<CourseDescription | null> => {
	const snap = await getDoc(doc(db, COLLECTION, id));
	if (!snap.exists()) return null;
	return { id: snap.id, ...snap.data() } as CourseDescription;
};

export const getCourseDescriptionBySlug = async (
	slug: string
): Promise<CourseDescription | null> => {
	const q = query(collection(db, COLLECTION), where('slug', '==', slug));
	const snap = await getDocs(q);
	if (snap.empty) return null;
	const d = snap.docs[0];
	return { id: d.id, ...d.data() } as CourseDescription;
};

export const saveCourseDescription = async (data: Omit<CourseDescription, 'id'>): Promise<void> => {
	// Use slug as document ID for easy lookup
	await setDoc(doc(db, COLLECTION, data.slug), stripUndefined(data));
};

export const deleteCourseDescription = async (id: string): Promise<void> => {
	await deleteDoc(doc(db, COLLECTION, id));
};

/**
 * Updates specific fields on a courseDescriptions document.
 * Supports Firestore `deleteField()` sentinel for removing fields.
 */
export const updateCourseDescriptionFields = async (
	id: string,
	// biome-ignore lint/suspicious/noExplicitAny: Firestore field values may include sentinels like deleteField()
	updates: Record<string, any>
): Promise<void> => {
	await updateDoc(doc(db, COLLECTION, id), stripUndefined(updates));
};

/**
 * Returns a Firestore deleteField() sentinel for removing fields from documents.
 */
export const getDeleteFieldSentinel = () => deleteField();
