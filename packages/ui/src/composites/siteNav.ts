import type { ElementType, ReactNode } from 'react';

/** One destination in `SiteHeader` or `SiteNavDrawer`. Same shape for both. */
export type SiteNavItem = {
	/** Stable key when `href` is repeated. Defaults to `href`. */
	readonly id?: string;
	readonly href: string;
	readonly label: ReactNode;
	readonly active?: boolean;
	/** Sets `target="_blank"` and `rel="noreferrer"`. */
	readonly external?: boolean;
};

/** @deprecated Use `SiteNavItem`. */
export type SiteHeaderLink = SiteNavItem;

/** @deprecated Use `SiteNavItem`. */
export type SiteNavDrawerLink = SiteNavItem;

/** Anchor or router link. Must accept `href`. */
export type SiteNavLinkComponent = ElementType;

export const siteNavItemKey = (item: SiteNavItem) => item.id ?? item.href;

export const siteNavLinkProps = (item: SiteNavItem) => ({
	href: item.href,
	target: item.external ? ('_blank' as const) : undefined,
	rel: item.external ? 'noreferrer' : undefined,
	'aria-current': item.active ? ('page' as const) : undefined,
});
