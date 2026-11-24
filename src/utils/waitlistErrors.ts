/** User-facing waitlist errors — never surface raw Firebase text. */

export const WAITLIST_JOIN_ERROR =
	'Nie udało się zapisać na listę oczekujących. Spróbuj ponownie lub napisz do nas.';

export const WAITLIST_LEAVE_ERROR =
	'Nie udało się opuścić listy oczekujących. Spróbuj ponownie.';

export const WAITLIST_LOAD_ERROR =
	'Nie udało się pobrać listy oczekujących. Odśwież stronę lub spróbuj ponownie.';

const FIREBASE_PERMISSION_CODES = new Set([
	'permission-denied',
	'PERMISSION_DENIED',
	'firestore/permission-denied',
]);

const looksLikeFirebasePermission = (message: string): boolean => {
	const lower = message.toLowerCase();
	return (
		lower.includes('missing or insufficient permissions') ||
		lower.includes('permission-denied') ||
		lower.includes('permission_denied')
	);
};

const logWaitlistError = (code: string, detail: unknown): void => {
	// biome-ignore lint/suspicious/noConsole: intentional waitlist diagnostics for support
	console.error('[waitlist]', code, detail);
};

export const getFirebaseErrorCode = (err: unknown): string | undefined => {
	if (err && typeof err === 'object' && 'code' in err) {
		const code = (err as { code?: unknown }).code;
		return typeof code === 'string' ? code : undefined;
	}
	return undefined;
};

export const mapWaitlistError = (
	err: unknown,
	fallback: string = WAITLIST_JOIN_ERROR
): string => {
	const code = getFirebaseErrorCode(err);
	const message = err instanceof Error ? err.message : typeof err === 'string' ? err : '';

	if (code && FIREBASE_PERMISSION_CODES.has(code)) {
		logWaitlistError(code, message || err);
		return fallback;
	}
	if (message && looksLikeFirebasePermission(message)) {
		logWaitlistError(code ?? 'permission', message);
		return fallback;
	}
	if (message && !looksLikeFirebasePermission(message) && !message.startsWith('Firebase')) {
		logWaitlistError(code ?? 'error', message);
		return message;
	}
	logWaitlistError(code ?? 'error', err);
	return fallback;
};
