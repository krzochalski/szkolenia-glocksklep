import type { Auth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';
import { z } from 'zod';

export const deleteUserBodySchema = z.object({
	uid: z.string().min(1),
});

type AuthErrorLike = {
	code?: string;
};

export const isAuthUserNotFound = (err: unknown): boolean => {
	const code = (err as AuthErrorLike | null)?.code;
	return code === 'auth/user-not-found';
};

/**
 * Admin deletes Auth account + Firestore profile.
 * Skips Auth delete when the user is already gone; refuses self-delete and admin targets.
 */
export const deleteUserAccount = async (
	auth: Auth,
	db: Firestore,
	actorUid: string,
	targetUid: string
): Promise<void> => {
	if (targetUid === actorUid) {
		throw new Error('Nie możesz usunąć własnego konta.');
	}

	const adminSnap = await db.doc(`admins/${targetUid}`).get();
	if (adminSnap.exists) {
		throw new Error('Nie można usunąć konta administratora.');
	}

	try {
		await auth.deleteUser(targetUid);
	} catch (err) {
		if (!isAuthUserNotFound(err)) throw err;
	}

	await db.doc(`users/${targetUid}`).delete();
};
