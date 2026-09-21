import { cloneElement, isValidElement, type ReactNode } from 'react';
import { MenuIcon, ShoppingCartOutlinedIcon } from '../icons';
import { joinSx } from '../joinSx';
import type { BoxProps } from '../primitives';
import { AppBar, Badge, Box, IconButton, Toolbar, Typography } from '../primitives';
import {
	type SiteNavItem,
	type SiteNavLinkComponent,
	SiteNavItemContent,
	siteNavItemKey,
	siteNavLinkProps,
} from './siteNav';

export type { SiteHeaderLink, SiteNavItem } from './siteNav';

/** Breakpoint where the link row replaces the menu button. */
export type SiteHeaderDesktopFrom = 'sm' | 'md' | 'lg';

export type SiteHeaderProps = {
	/** Wordmark string, or any node (logo, already-linked brand). */
	readonly brand: ReactNode;
	/** Wraps `brand` in `linkComponent`. Omit when `brand` is already a link. */
	readonly brandHref?: string;
	readonly links: readonly SiteNavItem[];
	readonly linkComponent?: SiteNavLinkComponent;
	/** Accessible name of the link row. Defaults to a string `brand`, otherwise `"Primary"`. */
	readonly navLabel?: string;
	/** Built-in cart. Omit `cartHref` to hide it. */
	readonly cartHref?: string;
	readonly cartCount?: number;
	/** Accessible name of the cart control. Default `"Cart"`. */
	readonly cartLabel?: string;
	/** Replaces the cart icon. Badge still uses `cartCount`. */
	readonly cartIcon?: ReactNode;
	/** Desktop cluster only, after the cart. Pass a second node as `mobileActions` for small screens. */
	readonly actions?: ReactNode;
	/** Small-screen cluster only, between the cart and the menu button. */
	readonly mobileActions?: ReactNode;
	readonly onOpenMenu?: () => void;
	readonly menuOpen?: boolean;
	/** Accessible name of the menu button. Default `"Open navigation"`. */
	readonly menuLabel?: string;
	/** Replaces the hamburger icon. */
	readonly menuIcon?: ReactNode;
	/** Link row shows from this breakpoint up. Default `"md"`. */
	readonly desktopFrom?: SiteHeaderDesktopFrom;
	readonly position?: 'fixed' | 'absolute' | 'sticky' | 'static' | 'relative';
	/** Default `true`. */
	readonly hideOnPrint?: boolean;
	/** Toolbar max width. `false` leaves it full bleed. Default `"xl"`. */
	readonly maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | false;
	readonly sx?: BoxProps['sx'];
	readonly toolbarSx?: BoxProps['sx'];
};

const wordmarkSx = {
	fontFamily: '"Space Grotesk", sans-serif',
	fontSize: { xs: '1.25rem', md: '1.5rem' },
	fontWeight: 700,
	letterSpacing: '-0.02em',
	lineHeight: 1,
	color: 'primary.main',
	textTransform: 'uppercase',
} as const;

const linkSx = (active: boolean | undefined) =>
	({
		fontFamily: '"Space Mono", monospace',
		fontSize: '0.875rem',
		fontWeight: 500,
		textDecoration: 'none',
		textTransform: 'uppercase',
		color: active ? 'primary.main' : 'text.secondary',
		borderBottom: '2px solid',
		borderColor: active ? 'primary.main' : 'transparent',
		pb: 0.5,
		transition: 'color 0.2s, border-color 0.2s',
		'&:hover': {
			color: 'primary.main',
		},
		'&:active': {
			transform: 'translate(1px, 1px)',
		},
	}) as const;

const clusterDisplay = (from: SiteHeaderDesktopFrom, kind: 'desktop' | 'mobile') =>
	kind === 'desktop' ? { xs: 'none', [from]: 'flex' } : { xs: 'flex', [from]: 'none' };

export const SiteHeader = ({
	brand,
	brandHref,
	links,
	linkComponent = 'a',
	navLabel,
	cartHref,
	cartCount = 0,
	cartLabel = 'Cart',
	cartIcon,
	actions,
	mobileActions,
	onOpenMenu,
	menuOpen = false,
	menuLabel = 'Open navigation',
	menuIcon,
	desktopFrom = 'md',
	position = 'sticky',
	hideOnPrint = true,
	maxWidth = 'xl',
	sx,
	toolbarSx,
}: SiteHeaderProps) => {
	const resolvedNavLabel = navLabel ?? (typeof brand === 'string' ? brand : 'Primary');
	const wordmark =
		typeof brand === 'string' ? (
			<Typography component='span' sx={wordmarkSx}>
				{brand}
			</Typography>
		) : (
			brand
		);
	const brandLinkSx = {
		textDecoration: 'none',
		display: 'flex',
		alignItems: 'center',
		minHeight: 48,
		color: 'inherit',
	} as const;

	const renderCart = () =>
		cartHref ? (
			<IconButton
				component={linkComponent}
				href={cartHref}
				aria-label={cartLabel}
				sx={{ color: 'primary.main', width: 48, height: 48 }}
			>
				<Badge badgeContent={cartCount} color='primary'>
					{cartIcon == null ? (
						<ShoppingCartOutlinedIcon />
					) : isValidElement(cartIcon) ? (
						cloneElement(cartIcon)
					) : (
						cartIcon
					)}
				</Badge>
			</IconButton>
		) : null;

	return (
		<AppBar
			position={position}
			sx={joinSx(hideOnPrint ? { '@media print': { display: 'none' } } : {}, sx)}
		>
			<Toolbar
				disableGutters
				sx={joinSx(
					{
						justifyContent: 'space-between',
						alignItems: 'center',
						px: { xs: 2, lg: 4 },
						minHeight: { xs: 56, md: 64 },
						height: { xs: 56, md: 64 },
						maxWidth: maxWidth === false ? 'none' : maxWidth,
						width: '100%',
						mx: 'auto',
						boxSizing: 'border-box',
					},
					toolbarSx
				)}
			>
				{brandHref ? (
					<Box component={linkComponent} href={brandHref} sx={brandLinkSx}>
						{wordmark}
					</Box>
				) : (
					<Box sx={brandLinkSx}>{wordmark}</Box>
				)}

				<Box
					component='nav'
					aria-label={resolvedNavLabel}
					sx={{
						display: clusterDisplay(desktopFrom, 'desktop'),
						gap: 4,
						alignItems: 'center',
					}}
				>
					{links.map((link) => (
						<Box
							key={siteNavItemKey(link)}
							component={linkComponent}
							{...siteNavLinkProps(link)}
							sx={linkSx(link.active)}
						>
							<SiteNavItemContent {...link} />
						</Box>
					))}
					{renderCart()}
					{actions}
				</Box>

				<Box
					sx={{
						display: clusterDisplay(desktopFrom, 'mobile'),
						alignItems: 'center',
						mr: -1.5,
					}}
				>
					{renderCart()}
					{mobileActions}
					{onOpenMenu ? (
						<IconButton
							color='inherit'
							aria-label={menuLabel}
							aria-expanded={menuOpen}
							onClick={onOpenMenu}
							sx={{ color: 'primary.main', width: 48, height: 48 }}
						>
							{menuIcon ?? <MenuIcon />}
						</IconButton>
					) : null}
				</Box>
			</Toolbar>
		</AppBar>
	);
};
