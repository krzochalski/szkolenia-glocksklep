import type { User } from '@/types/user';
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { auth } from './auth';
import { db } from './firestore';

export type { User as UserProfile } from '@/types/user';

export const getUserProfile = async (): Promise<User | null> => {
	const user = auth.currentUser;
	if (!user) return null;
	const snap = await getDoc(doc(db, 'users', user.uid));
	if (!snap.exists()) return null;
	return { uid: snap.id, email: '', displayName: '', createdAt: '', ...snap.data() } as User;
};

export const saveUserProfile = async (
	data: Omit<User, 'uid' | 'email' | 'createdAt'> & { createdAt?: string }
): Promise<void> => {
	const user = auth.currentUser;
	if (!user) throw new Error('Brak zalogowanego użytkownika.');
	const ref = doc(db, 'users', user.uid);
	const snap = await getDoc(ref);
	// Strip undefined values — Firestore rejects them
	const clean = Object.fromEntries(
		Object.entries(data).filter(([, v]) => v !== undefined && v !== '')
	);
	if (snap.exists()) {
		await updateDoc(ref, clean);
	} else {
		await setDoc(ref, {
			uid: user.uid,
			email: user.email ?? '',
			createdAt: user.metadata.creationTime ?? new Date().toISOString(),
			...clean,
		});
	}
};

export const adminGetUsers = async (): Promise<User[]> => {
	// No orderBy — avoids excluding docs where displayName is missing
	const snap = await getDocs(collection(db, 'users'));
	return snap.docs
		.map(
			(d) =>
				({
					uid: d.id,
					email: d.data().email ?? '',
					displayName: d.data().displayName ?? '',
					createdAt: d.data().createdAt ?? '',
					...d.data(),
				}) as User
		)
		.sort((a, b) => (a.displayName || a.email).localeCompare(b.displayName || b.email));
};

export const adminDeleteUser = async (uid: string): Promise<void> => {
	await deleteDoc(doc(db, 'users', uid));
};
