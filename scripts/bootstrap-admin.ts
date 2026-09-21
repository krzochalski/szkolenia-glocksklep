/**
 * Bootstrap admin user + Auth provider setup helpers for szkolenia-glocksklep.
 *
 * Usage (with ADC or GOOGLE_APPLICATION_CREDENTIALS):
 *   pnpm exec tsx scripts/bootstrap-admin.ts
 *
 * Env:
 *   ADMIN_EMAIL (default szkolenia@glocksklep.pl)
 *   ADMIN_TEMP_PASSWORD (optional; random if omitted — user resets via email)
 */
import { randomBytes } from 'node:crypto';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const PROJECT_ID = process.env.GCLOUD_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT ?? 'szkolenia-glocksklep';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? 'szkolenia@glocksklep.pl').trim().toLowerCase();
const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? 'https://szkolenia.glocksklep.pl';
const ACTION_HANDLER = `${SITE_ORIGIN}/auth/action`;

if (getApps().length === 0) {
	initializeApp({ projectId: PROJECT_ID });
}

const auth = getAuth();
const db = getFirestore();

const main = async () => {
	const tempPassword =
		process.env.ADMIN_TEMP_PASSWORD ?? `Tmp-${randomBytes(12).toString('base64url')}!aA1`;

	let user;
	try {
		user = await auth.getUserByEmail(ADMIN_EMAIL);
		console.log(`Auth user exists: ${user.uid} <${ADMIN_EMAIL}>`);
	} catch {
		user = await auth.createUser({
			email: ADMIN_EMAIL,
			password: tempPassword,
			emailVerified: true,
			displayName: 'Admin Szkolenia',
		});
		console.log(`Created Auth user: ${user.uid} <${ADMIN_EMAIL}>`);
		console.log(`Temporary password (reset via email): ${tempPassword}`);
	}

	await db.doc(`admins/${user.uid}`).set(
		{
			email: ADMIN_EMAIL,
			createdAt: FieldValue.serverTimestamp(),
			role: 'admin',
		},
		{ merge: true }
	);
	console.log(`Wrote admins/${user.uid}`);

	await db.doc(`users/${user.uid}`).set(
		{
			uid: user.uid,
			email: ADMIN_EMAIL,
			displayName: user.displayName ?? 'Admin Szkolenia',
			createdAt: user.metadata.creationTime ?? new Date().toISOString(),
		},
		{ merge: true }
	);
	console.log(`Wrote users/${user.uid}`);

	// Password reset link landing on our custom handler / continue URL
	const resetLink = await auth.generatePasswordResetLink(ADMIN_EMAIL, {
		url: `${SITE_ORIGIN}/login?reset=1`,
		handleCodeInApp: true,
	});
	console.log('\nPassword reset link (open to set your password):\n');
	console.log(resetLink);
	console.log('\n--- Firebase Console checklist ---');
	console.log('1. Authentication → Sign-in method: Email/Password ON, Email link ON, Google ON');
	console.log('2. Authentication → Settings → Authorized domains:');
	console.log('   - szkolenia.glocksklep.pl');
	console.log('   - localhost');
	console.log('   - szkolenia-glocksklep.firebaseapp.com');
	console.log('3. Authentication → Templates → Customize action URL:');
	console.log(`   ${ACTION_HANDLER}`);
	console.log('4. Deploy auth providers: firebase deploy --only auth');
};

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
