import type { FaqItem } from '@/types/faq';
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

const COLLECTION = 'faq';

export const getFaqItems = async (): Promise<FaqItem[]> => {
	const q = query(collection(db, COLLECTION), orderBy('order', 'asc'));
	const snap = await getDocs(q);
	return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FaqItem);
};

export const createFaqItem = async (data: Omit<FaqItem, 'id'>): Promise<FaqItem> => {
	const ref = await addDoc(collection(db, COLLECTION), stripUndefined(data));
	return { id: ref.id, ...data };
};

export const updateFaqItem = async (
	id: string,
	data: Partial<Omit<FaqItem, 'id'>>
): Promise<void> => {
	await updateDoc(doc(db, COLLECTION, id), stripUndefined(data));
};

export const deleteFaqItem = async (id: string): Promise<void> => {
	await deleteDoc(doc(db, COLLECTION, id));
};
