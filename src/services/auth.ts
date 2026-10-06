import { stripUndefined } from '@/utils/common';
import type { Unsubscribe, User, UserCredential } from 'firebase/auth';
import {
	EmailAuthProvider,
	GoogleAuthProvider,
	applyActionCode,
	checkActionCode,
	confirmPasswordReset,
	createUserWithEmailAndPassword,
	signOut as firebaseSignOut,
	getAuth,
	getRedirectResult,
	isSignInWithEmailLink,
	onAuthStateChanged,
	reauthenticateWithCredential,
	sendPasswordResetEmail,
	sendSignInLinkToEmail,
	signInWithEmailAndPassword,
	signInWithEmailLink,
	signInWithPopup,
	signInWithRedirect,
	updatePassword,
	updateProfile,
	verifyPasswordResetCode,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { firebaseApp } from './firebase';
import { db } from './firestore';

const siteOrigin = (): string =>
	typeof window !== 'undefined' ? window.location.origin : 'https://szkolenia.glocksklep.pl';

/** Prefer CF (custom action URL via SMTP). Fall back to Firebase Auth mailer if CF/SMTP is down. */
const postAuthEmail = async (path: '/api/password-reset' | '/api/email-sign-in-link', email: string) => {
	const res = await fetch(path, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email }),
	});
	if (res.ok) return;

	try {
		if (path === '/api/password-reset') {
			await sendPasswordResetEmail(auth, email, {
				url: `${siteOrigin()}/login?reset=1`,
				handleCodeInApp: true,
			});
			return;
		}
		await sendSignInLinkToEmail(auth, email, {
			url: `${siteOrigin()}/auth/email-link`,
			handleCodeInApp: true,
		});
	} catch {
		const e = await res.json().catch(() => ({}));
		throw new Error(
			typeof e === 'object' && e !== null && 'error' in e && typeof e.error === 'string'
				? e.error
				: 'Nie udało się wysłać e-maila.'
		);
	}
};

export const auth = getAuth(firebaseApp);

export const EMAIL_LINK_STORAGE_KEY = 'emailForSignIn';

export const onAuthStateChange = (callback: (user: User | null) => void): Unsubscribe => {
	return onAuthStateChanged(auth, callback);
};

export const signOut = async (): Promise<void> => {
	await firebaseSignOut(auth);
};

export const getCurrentUser = (): User | null => {
	return auth.currentUser;
};

export const ensureUserProfile = async (user: User): Promise<void> => {
	const ref = doc(db, 'users', user.uid);
	const snap = await getDoc(ref);
	if (snap.exists()) return;
	await setDoc(
		ref,
		stripUndefined({
			uid: user.uid,
			email: user.email ?? '',
			displayName: user.displayName ?? '',
			phoneNumber: user.phoneNumber ?? undefined,
			createdAt: user.metadata.creationTime ?? new Date().toISOString(),
		})
	);
};

export const signInWithEmail = async (email: string, password: string): Promise<UserCredential> => {
	const result = await signInWithEmailAndPassword(auth, email, password);
	await ensureUserProfile(result.user);
	return result;
};

export const registerWithEmail = async (
	email: string,
	displayName: string,
	phone: string
): Promise<void> => {
	const randomPassword = uuidv4() + uuidv4(); // 72-char random string, never shown
	const { user } = await createUserWithEmailAndPassword(auth, email, randomPassword);
	try {
		await updateProfile(user, { displayName });
		await setDoc(doc(db, 'users', user.uid), {
			uid: user.uid,
			email,
			displayName,
			phoneNumber: phone,
			createdAt: user.metadata.creationTime ?? new Date().toISOString(),
		});
		await postAuthEmail('/api/password-reset', email);
	} finally {
		// Always sign out — the random password is never shown; user must set one via email.
		await firebaseSignOut(auth);
	}
};

export const sendPasswordReset = async (email: string): Promise<void> => {
	await postAuthEmail('/api/password-reset', email);
};

export const verifyPasswordResetOobCode = async (oobCode: string): Promise<string> => {
	return verifyPasswordResetCode(auth, oobCode);
};

export const confirmPasswordResetWithCode = async (
	oobCode: string,
	newPassword: string
): Promise<void> => {
	await confirmPasswordReset(auth, oobCode, newPassword);
};

export const applyEmailActionCode = async (oobCode: string): Promise<void> => {
	await applyActionCode(auth, oobCode);
};

export const inspectActionCode = async (oobCode: string) => {
	return checkActionCode(auth, oobCode);
};

export const updateUserProfile = async (displayName: string): Promise<void> => {
	const user = auth.currentUser;
	if (!user) throw new Error('Brak zalogowanego użytkownika.');
	await updateProfile(user, { displayName });
};

export const updateUserPassword = async (
	currentPassword: string,
	newPassword: string
): Promise<void> => {
	const user = auth.currentUser;
	if (!user?.email) throw new Error('Brak zalogowanego użytkownika.');
	const credential = EmailAuthProvider.credential(user.email, currentPassword);
	await reauthenticateWithCredential(user, credential);
	await updatePassword(user, newPassword);
};

export const signInWithGoogle = async (): Promise<UserCredential> => {
	const provider = new GoogleAuthProvider();
	try {
		const result = await signInWithPopup(auth, provider);
		await ensureUserProfile(result.user);
		return result;
	} catch (error: unknown) {
		const code =
			typeof error === 'object' && error !== null && 'code' in error
				? String((error as { code: string }).code)
				: '';
		if (
			code === 'auth/popup-blocked' ||
			code === 'auth/operation-not-supported-in-this-environment'
		) {
			await signInWithRedirect(auth, provider);
		}
		throw error;
	}
};

export const completeGoogleRedirectSignIn = async (): Promise<UserCredential | null> => {
	const result = await getRedirectResult(auth);
	if (result?.user) {
		await ensureUserProfile(result.user);
	}
	return result;
};

export const sendEmailSignInLink = async (email: string): Promise<void> => {
	await postAuthEmail('/api/email-sign-in-link', email);
	window.localStorage.setItem(EMAIL_LINK_STORAGE_KEY, email);
};

export const isEmailSignInLink = (url: string = window.location.href): boolean => {
	return isSignInWithEmailLink(auth, url);
};

export const completeEmailLinkSignIn = async (email?: string): Promise<UserCredential> => {
	const href = window.location.href;
	if (!isSignInWithEmailLink(auth, href)) {
		throw new Error('Nieprawidłowy link logowania.');
	}
	const emailForSignIn = email ?? window.localStorage.getItem(EMAIL_LINK_STORAGE_KEY);
	if (!emailForSignIn) {
		throw new Error('Podaj e-mail użyty do logowania.');
	}
	const result = await signInWithEmailLink(auth, emailForSignIn, href);
	window.localStorage.removeItem(EMAIL_LINK_STORAGE_KEY);
	await ensureUserProfile(result.user);
	return result;
};
