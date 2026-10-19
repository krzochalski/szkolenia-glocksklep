import { DEFAULT_COOKIES_POLICY_MD } from '@constants/legalMarkdown';
import type { CookiesPolicyDocument } from '@/types/cookiesPolicy';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firestore';

const COLLECTION = 'cookiesPolicy';
const DOC_ID = 'content';

export const getCookiesPolicy = async (): Promise<CookiesPolicyDocument> => {
	const snap = await getDoc(doc(db, COLLECTION, DOC_ID));
	if (!snap.exists()) {
		return { content: DEFAULT_COOKIES_POLICY_MD };
	}
	const data = snap.data();
	return {
		content: typeof data.content === 'string' ? data.content : DEFAULT_COOKIES_POLICY_MD,
		updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() ?? undefined,
	};
};

export const saveCookiesPolicy = async (content: string): Promise<void> => {
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
export const seedCookiesPolicyIfMissing = async (): Promise<boolean> => {
	const ref = doc(db, COLLECTION, DOC_ID);
	const snap = await getDoc(ref);
	if (snap.exists()) return false;
	await setDoc(ref, {
		content: DEFAULT_COOKIES_POLICY_MD,
		updatedAt: serverTimestamp(),
	});
	return true;
};
