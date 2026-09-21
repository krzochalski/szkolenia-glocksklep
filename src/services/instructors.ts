import type { Instructor } from '@/types/course';
import { stripUndefined } from '@/utils/common';
import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDocs,
	orderBy,
	query,
	updateDoc,
	where,
} from 'firebase/firestore';
import { db } from './firestore';

const COL = 'instructors';

export const getInstructors = async (): Promise<Instructor[]> => {
	const snap = await getDocs(query(collection(db, COL), orderBy('name')));
	return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Instructor);
};

export const getInstructorBySlug = async (slug: string): Promise<Instructor | null> => {
	const q = query(collection(db, COL), where('slug', '==', slug));
	const snap = await getDocs(q);
	if (snap.empty) return null;
	const d = snap.docs[0];
	return { id: d.id, ...d.data() } as Instructor;
};

export const createInstructor = async (data: Omit<Instructor, 'id'>): Promise<void> => {
	await addDoc(collection(db, COL), stripUndefined(data));
};

export const updateInstructor = async (id: string, data: Omit<Instructor, 'id'>): Promise<void> => {
	await updateDoc(doc(db, COL, id), stripUndefined({ ...data }));
};

export const deleteInstructor = async (id: string): Promise<void> => {
	await deleteDoc(doc(db, COL, id));
};
