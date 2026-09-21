import type { Tag } from '@/types/course';
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
} from 'firebase/firestore';
import { db } from './firestore';

const COL = 'tags';

export const getTags = async (): Promise<Tag[]> => {
	const snap = await getDocs(query(collection(db, COL), orderBy('name')));
	return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Tag);
};

export const createTag = async (data: Omit<Tag, 'id'>): Promise<void> => {
	await addDoc(collection(db, COL), stripUndefined(data));
};

export const updateTag = async (id: string, data: Omit<Tag, 'id'>): Promise<void> => {
	await updateDoc(doc(db, COL, id), stripUndefined({ ...data }));
};

export const deleteTag = async (id: string): Promise<void> => {
	await deleteDoc(doc(db, COL, id));
};
