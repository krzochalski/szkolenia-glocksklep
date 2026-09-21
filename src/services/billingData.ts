import type { BillingData } from '@/types/billingData';
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

const COLLECTION = 'billingData';

/** Fallback billing data used when no Firestore document exists for an instructor */
const FALLBACK_BILLING: Omit<BillingData, 'id' | 'instructorId'> = {
	name: 'Stay Frosty PIOTR KRZOSKA',
	address: 'Łaska 75/79',
	city: '98-220 Zduńska Wola, Polska',
	nip: '8291724148',
	website: 'http://glocksklep.pl/',
	phone: '+48530556523',
	bankName: 'mBank',
	bankAccount: 'PL19114020040000310277052051',
	paymentMethod: 'Przelew',
	issuePlace: 'Zduńska Wola',
	vatRate: 23,
};

/** Fetches all billing data sets (admin). */
export const getAllBillingData = async (): Promise<BillingData[]> => {
	const q = query(collection(db, COLLECTION), orderBy('name'));
	const snap = await getDocs(q);
	return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as BillingData);
};

/** Fetches billing data for a specific instructor. Falls back to default if none exists. */
export const getBillingDataByInstructor = async (instructorId: string): Promise<BillingData> => {
	const q = query(collection(db, COLLECTION), where('instructorId', '==', instructorId));
	const snap = await getDocs(q);
	if (snap.empty) {
		return { id: 'fallback', instructorId, ...FALLBACK_BILLING };
	}
	return { id: snap.docs[0].id, ...snap.docs[0].data() } as BillingData;
};

/** Fetches billing data by instructor slug. Falls back to default if none exists. */
export const getBillingDataByInstructorSlug = async (slug: string): Promise<BillingData> => {
	const instructorQuery = query(collection(db, 'instructors'), where('slug', '==', slug));
	const instructorSnap = await getDocs(instructorQuery);
	if (instructorSnap.empty) {
		return { id: 'fallback', instructorId: '', ...FALLBACK_BILLING };
	}
	const instructorId = instructorSnap.docs[0].id;
	return getBillingDataByInstructor(instructorId);
};

/** Creates a new billing data set. */
export const createBillingData = async (data: Omit<BillingData, 'id'>): Promise<void> => {
	await addDoc(collection(db, COLLECTION), stripUndefined(data));
};

/** Updates an existing billing data set. */
export const updateBillingData = async (
	id: string,
	data: Omit<BillingData, 'id'>
): Promise<void> => {
	await updateDoc(doc(db, COLLECTION, id), stripUndefined({ ...data }));
};

/** Deletes a billing data set. */
export const deleteBillingData = async (id: string): Promise<void> => {
	await deleteDoc(doc(db, COLLECTION, id));
};
