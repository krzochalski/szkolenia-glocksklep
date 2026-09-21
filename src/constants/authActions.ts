import { Paths } from '@/constants/paths';
import { SITE_ORIGIN } from '@constants/seo';

/** Prefer configured public origin; fall back to browser origin in the client. */
export const authContinueOrigin = (): string => {
	if (typeof window !== 'undefined' && window.location?.origin) {
		const host = window.location.hostname;
		if (host === 'localhost' || host === '127.0.0.1') {
			return window.location.origin;
		}
	}
	return process.env.NEXT_PUBLIC_SITE_ORIGIN ?? SITE_ORIGIN;
};

export const passwordResetActionCodeSettings = () => ({
	url: `${authContinueOrigin()}${Paths.login}?reset=1`,
	handleCodeInApp: true,
});

export const emailLinkActionCodeSettings = () => ({
	url: `${authContinueOrigin()}${Paths.emailLink}`,
	handleCodeInApp: true,
});

/** Custom email action handler (Firebase Console → Templates → customize action URL). */
export const AUTH_ACTION_HANDLER_PATH = '/auth/action';

export const authActionHandlerUrl = (): string =>
	`${process.env.NEXT_PUBLIC_SITE_ORIGIN ?? SITE_ORIGIN}${AUTH_ACTION_HANDLER_PATH}`;
