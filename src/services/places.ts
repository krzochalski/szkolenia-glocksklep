import type { Place } from '@/types/course';
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

const COL = 'places';

export const getPlaces = async (): Promise<Place[]> => {
	const snap = await getDocs(query(collection(db, COL), orderBy('name')));
	return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Place);
};

export const createPlace = async (data: Omit<Place, 'id'>): Promise<void> => {
	await addDoc(collection(db, COL), stripUndefined(data));
};

export const updatePlace = async (id: string, data: Omit<Place, 'id'>): Promise<void> => {
	await updateDoc(doc(db, COL, id), stripUndefined({ ...data }));
};

export const deletePlace = async (id: string): Promise<void> => {
	await deleteDoc(doc(db, COL, id));
};
