import { doc, getDoc } from 'firebase/firestore';
import { db } from './firestore';

/**
 * Checks whether a user with the given UID has admin privileges.
 * Returns `true` if a document exists in the `admins` collection for that UID.
 */
export const isUserAdmin = async (uid: string): Promise<boolean> => {
	const snap = await getDoc(doc(db, 'admins', uid));
	return snap.exists();
};
