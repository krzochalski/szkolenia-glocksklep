import type {
	ContactRequest,
	ContactRequestInput,
	ContactRequestStatus,
} from '@/types/contactRequest';
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

const COLLECTION = 'contactRequests';

export const submitContactRequest = async (input: ContactRequestInput): Promise<void> => {
	const phone = input.phone?.trim();
	await addDoc(collection(db, COLLECTION), {
		format: input.format,
		email: input.email.trim(),
		...(phone ? { phone } : {}),
		message: input.message.trim(),
		status: 'new' satisfies ContactRequestStatus,
		createdAt: new Date().toISOString(),
	});
};

export const adminGetContactRequests = async (): Promise<ContactRequest[]> => {
	const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
	const snap = await getDocs(q);
	return snap.docs.map((d) => {
		const data = d.data();
		return {
			id: d.id,
			format: data.format,
			email: data.email,
			...(typeof data.phone === 'string' && data.phone ? { phone: data.phone } : {}),
			message: data.message,
			status: data.status,
			createdAt: data.createdAt,
		} as ContactRequest;
	});
};

export const adminUpdateContactRequestStatus = async (
	id: string,
	status: ContactRequestStatus
): Promise<void> => {
	await updateDoc(doc(db, COLLECTION, id), { status });
};

export const adminDeleteContactRequest = async (id: string): Promise<void> => {
	await deleteDoc(doc(db, COLLECTION, id));
};
