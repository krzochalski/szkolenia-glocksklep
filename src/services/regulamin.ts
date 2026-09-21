import type { RegulaminDocument } from '@/types/regulamin';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firestore';

const COLLECTION = 'regulamin';
const DOC_ID = 'content';

const DEFAULT_REGULAMIN = '# Regulamin\n\nTreść regulaminu zostanie uzupełniona.';

export const getRegulamin = async (): Promise<RegulaminDocument> => {
	const snap = await getDoc(doc(db, COLLECTION, DOC_ID));
	if (!snap.exists()) {
		return { content: DEFAULT_REGULAMIN };
	}
	const data = snap.data();
	return {
		content: typeof data.content === 'string' ? data.content : DEFAULT_REGULAMIN,
		updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() ?? undefined,
	};
};

export const saveRegulamin = async (content: string): Promise<void> => {
	await setDoc(
		doc(db, COLLECTION, DOC_ID),
		{
			content,
			updatedAt: serverTimestamp(),
		},
		{ merge: true }
	);
};

/** Seeds Firestore with default markdown when document is missing. Admin only. */
export const seedRegulaminIfMissing = async (): Promise<boolean> => {
	const ref = doc(db, COLLECTION, DOC_ID);
	const snap = await getDoc(ref);
	if (snap.exists()) return false;
	await setDoc(ref, {
		content: DEFAULT_REGULAMIN,
		updatedAt: serverTimestamp(),
	});
	return true;
};
