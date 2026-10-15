import type { PrivacyPolicyDocument } from '@/types/privacyPolicy';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firestore';

const COLLECTION = 'privacyPolicy';
const DOC_ID = 'content';

const DEFAULT_PRIVACY_POLICY =
	'# Polityka prywatności\n\nTreść polityki prywatności zostanie uzupełniona.';

export const getPrivacyPolicy = async (): Promise<PrivacyPolicyDocument> => {
	const snap = await getDoc(doc(db, COLLECTION, DOC_ID));
	if (!snap.exists()) {
		return { content: DEFAULT_PRIVACY_POLICY };
	}
	const data = snap.data();
	return {
		content: typeof data.content === 'string' ? data.content : DEFAULT_PRIVACY_POLICY,
		updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() ?? undefined,
	};
};

export const savePrivacyPolicy = async (content: string): Promise<void> => {
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
export const seedPrivacyPolicyIfMissing = async (): Promise<boolean> => {
	const ref = doc(db, COLLECTION, DOC_ID);
	const snap = await getDoc(ref);
	if (snap.exists()) return false;
	await setDoc(ref, {
		content: DEFAULT_PRIVACY_POLICY,
		updatedAt: serverTimestamp(),
	});
	return true;
};
