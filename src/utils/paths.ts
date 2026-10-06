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
