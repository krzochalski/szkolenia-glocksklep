import { getAuth } from 'firebase-admin/auth';
import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import { z } from 'zod';

export const bootstrapBodySchema = z.object({
	adminEmail: z.string().email().optional(),
	adminPassword: z.string().min(8).max(128).optional(),
});

export const runBootstrap = async (db: Firestore, body: unknown) => {
	const parsed = bootstrapBodySchema.parse(body ?? {});
	const adminsSnap = await db.collection('admins').limit(1).get();

	const result: {
		adminUid: string | null;
		adminCreated: boolean;
	} = {
		adminUid: null,
		adminCreated: false,
	};

	if (adminsSnap.empty && parsed.adminEmail && parsed.adminPassword) {
		const auth = getAuth();
		let user;
		try {
			user = await auth.getUserByEmail(parsed.adminEmail);
		} catch {
			user = await auth.createUser({
				email: parsed.adminEmail,
				password: parsed.adminPassword,
				emailVerified: true,
			});
			result.adminCreated = true;
		}
		await db.doc(`admins/${user.uid}`).set({
			email: parsed.adminEmail,
			createdAt: FieldValue.serverTimestamp(),
		});
		result.adminUid = user.uid;
	}

	return result;
};
