/** Replaces `$param` segments in Paths templates with concrete values. */
export const fillPath = (template: string, params: Record<string, string>): string =>
	Object.entries(params).reduce((acc, [key, value]) => acc.replace(`$${key}`, value), template);

/** Same-origin relative path only — rejects open redirects. */
export const safeRedirectPath = (value: string | null | undefined, fallback: string): string => {
	if (!value?.startsWith('/') || value.startsWith('//')) return fallback;
	return value;
};

export const withRedirectQuery = (path: string, redirect: string): string => {
	const sep = path.includes('?') ? '&' : '?';
	return `${path}${sep}redirect=${encodeURIComponent(redirect)}`;
};

export type AuthReturnQuery = {
	readonly redirect: string;
	readonly termin?: string | null;
};

/** Appends `redirect` and optional `termin` while preserving other query params on `path`. */
export const withAuthReturnQuery = (path: string, { redirect, termin }: AuthReturnQuery): string => {
	const url = new URL(path, 'http://_/');
	url.searchParams.set('redirect', redirect);
	if (termin) {
		url.searchParams.set('termin', termin);
	} else {
		url.searchParams.delete('termin');
	}
	return `${url.pathname}${url.search}`;
};

/** Combines safe redirect with optional `termin` for the post-auth destination. */
export const buildPostAuthPath = (
	redirect: string | null | undefined,
	termin: string | null | undefined,
	fallback: string
): string => {
	const base = safeRedirectPath(redirect, fallback);
	if (!termin?.trim()) return base;
	const url = new URL(base, 'http://_/');
	if (!url.searchParams.get('termin')) {
		url.searchParams.set('termin', termin);
	}
	return `${url.pathname}${url.search}`;
};

/** Extracts course slug from `/szkolenia/{slug}` redirect paths. */
export const courseSlugFromRedirect = (redirect: string | null | undefined): string | null => {
	if (!redirect) return null;
	const path = safeRedirectPath(redirect, '');
	if (!path) return null;
	const match = path.match(/^\/szkolenia\/([^/?#]+)/);
	return match?.[1] ?? null;
};

export const AUTH_RETURN_STORAGE_KEY = 'authReturnPath';

export const storeAuthReturnPath = (path: string): void => {
	if (typeof window === 'undefined') return;
	window.sessionStorage.setItem(AUTH_RETURN_STORAGE_KEY, path);
};

export const takeAuthReturnPath = (fallback: string): string => {
	if (typeof window === 'undefined') return fallback;
	const stored = window.sessionStorage.getItem(AUTH_RETURN_STORAGE_KEY);
	window.sessionStorage.removeItem(AUTH_RETURN_STORAGE_KEY);
	return safeRedirectPath(stored, fallback);
};
