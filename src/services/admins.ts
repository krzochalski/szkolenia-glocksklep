import type { AdminDoc, AdminSettings } from '@/types/admin';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth } from './auth';
import { db } from './firestore';

/**
 * Checks whether a user with the given UID has admin privileges.
 * Returns `true` if a document exists in the `admins` collection for that UID.
 */
export const isUserAdmin = async (uid: string): Promise<boolean> => {
	const snap = await getDoc(doc(db, 'admins', uid));
	return snap.exists();
};

export const getAdminSettings = async (uid: string): Promise<AdminSettings> => {
	const snap = await getDoc(doc(db, 'admins', uid));
	if (!snap.exists()) return {};
	const data = snap.data() as AdminDoc;
	const menuOrder = data.settings?.menuOrder;
	if (!Array.isArray(menuOrder)) return {};
	return {
		menuOrder: menuOrder.filter((id): id is string => typeof id === 'string'),
	};
};

export const saveAdminMenuOrder = async (menuOrder: readonly string[]): Promise<void> => {
	const user = auth.currentUser;
	if (!user) throw new Error('Brak zalogowanego użytkownika.');
	await updateDoc(doc(db, 'admins', user.uid), {
		settings: { menuOrder: [...menuOrder] },
	});
};
