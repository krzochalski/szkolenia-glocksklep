import {
	DEFAULT_OG_IMAGE_PATH,
	META_DESCRIPTION_MAX,
	SITE_NAME,
	SITE_ORIGIN,
} from '@constants/seo';

export const pageTitle = (page: string): string => {
	const trimmed = page.trim();
	if (!trimmed) return SITE_NAME;
	if (
		trimmed === SITE_NAME ||
		trimmed.startsWith(SITE_NAME) ||
		trimmed.includes(` | ${SITE_NAME}`)
	) {
		return trimmed;
	}
	return `${trimmed} | ${SITE_NAME}`;
};

export const stripMarkdown = (input: string): string =>
	input
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/`([^`]+)`/g, '$1')
		.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
		.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
		.replace(/^#{1,6}\s+/gm, '')
		.replace(/[*_~]+/g, '')
		.replace(/\s+/g, ' ')
		.trim();

export const truncatePlainText = (text: string, max = META_DESCRIPTION_MAX): string => {
	const trimmed = text.trim();
	if (trimmed.length <= max) return trimmed;
	const cut = trimmed.slice(0, Math.max(1, max - 1));
	const sp = cut.lastIndexOf(' ');
	const base = sp > Math.floor(max * 0.5) ? cut.slice(0, sp) : cut;
	return `${base.trim()}…`;
};

export const itemTitle = (name: string, metaTitle?: string): string => {
	const override = metaTitle?.trim();
	return override ? pageTitle(override) : pageTitle(name);
};

export const itemDescription = (fallback: string, metaDescription?: string): string => {
	const override = metaDescription?.trim();
	if (override) return truncatePlainText(stripMarkdown(override));
	return truncatePlainText(stripMarkdown(fallback));
};

export const absoluteUrl = (pathOrUrl: string, origin = SITE_ORIGIN): string => {
	const trimmed = pathOrUrl.trim();
	if (!trimmed) return origin;
	if (/^https?:\/\//i.test(trimmed)) return trimmed;
	const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
	return `${origin}${path}`;
};

export const defaultOgImageUrl = (origin = SITE_ORIGIN): string =>
	absoluteUrl(DEFAULT_OG_IMAGE_PATH, origin);

export const canonicalPath = (pathname: string, origin = SITE_ORIGIN): string => {
	if (!pathname || pathname === '/') return `${origin}/`;
	const noQuery = pathname.split('?')[0]?.split('#')[0] ?? pathname;
	const normalized = noQuery.length > 1 && noQuery.endsWith('/') ? noQuery.slice(0, -1) : noQuery;
	return absoluteUrl(normalized.startsWith('/') ? normalized : `/${normalized}`, origin);
};

export const lastmodDate = (iso: string): string | undefined => {
	const d = iso.slice(0, 10);
	return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : undefined;
};
