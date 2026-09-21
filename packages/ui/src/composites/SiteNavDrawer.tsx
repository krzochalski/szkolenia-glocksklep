import type { ReactNode } from 'react';
import { CloseIcon } from '../icons';
import { joinSx } from '../joinSx';
import type { BoxProps } from '../primitives';
import { Box } from '../primitives';
import { brand } from '../theme';
import {
	type SiteNavItem,
	type SiteNavLinkComponent,
	SiteNavItemContent,
	siteNavItemKey,
	siteNavLinkProps,
} from './siteNav';

export type { SiteNavDrawerLink } from './siteNav';

export type SiteNavDrawerProps = {
	readonly open: boolean;
	readonly onClose: () => void;
	readonly links: readonly SiteNavItem[];
	readonly linkComponent?: SiteNavLinkComponent;
	/** Title in the drawer head. Default `"MENU"`. Ignored when `header` is set. */
	readonly title?: ReactNode;
	/** Replaces the title node. The close button stays. */
	readonly header?: ReactNode;
	/** Accessible name of the dialog. Defaults to a string `title`, otherwise `"Menu"`. */
	readonly ariaLabel?: string;
	/** Pinned to the bottom of the panel. */
	readonly footer?: ReactNode;
	readonly closeLabel?: string;
	readonly closeIcon?: ReactNode;
	/** `start` slides in from the left. Default `"start"`. */
	readonly side?: 'start' | 'end';
	/** Panel width. Number is pixels. Default `"min(320px, 100%)"`. */
	readonly width?: number | string;
	readonly navLabel?: string;
	readonly sx?: BoxProps['sx'];
	readonly backdropSx?: BoxProps['sx'];
};

const panelWidth = (width: number | string) => (typeof width === 'number' ? `${width}px` : width);

export const SiteNavDrawer = ({
	open,
	onClose,
	links,
	linkComponent = 'a',
	title = 'MENU',
	header,
	ariaLabel,
	footer,
	closeLabel = 'Close navigation',
	closeIcon,
	side = 'start',
	width = 'min(320px, 100%)',
	navLabel,
	sx,
	backdropSx,
}: SiteNavDrawerProps) => {
	if (!open) return null;

	const end = side === 'end';
	const dialogLabel = ariaLabel ?? (typeof title === 'string' ? title : 'Menu');

	return (
		<Box
			onClick={onClose}
			role='presentation'
			sx={joinSx(
				{
					position: 'fixed',
					inset: 0,
					background: brand.inkOverlay,
					backdropFilter: 'blur(4px)',
					zIndex: 60,
					display: 'flex',
					justifyContent: end ? 'flex-end' : 'flex-start',
				},
				backdropSx
			)}
		>
			<Box
				component='aside'
				onClick={(event) => event.stopPropagation()}
				role='dialog'
				aria-label={dialogLabel}
				sx={joinSx(
					{
						height: '100%',
						width: panelWidth(width),
						maxWidth: '100%',
						bgcolor: 'background.paper',
						borderRight: end ? 'none' : '2px solid',
						borderLeft: end ? '2px solid' : 'none',
						borderColor: 'ink.main',
						display: 'flex',
						flexDirection: 'column',
						p: 3,
						boxShadow: end ? `-6px 0 0 0 ${brand.ink}` : `6px 0 0 0 ${brand.ink}`,
					},
					sx
				)}
			>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						mb: 4,
						minHeight: 48,
						gap: 2,
					}}
				>
					{header ?? (
						<Box
							sx={{
								fontSize: '1.5rem',
								fontWeight: 900,
								letterSpacing: '-0.05em',
								color: 'accentDark.main',
								fontFamily: '"Space Grotesk", sans-serif',
								textTransform: 'uppercase',
							}}
						>
							{title}
						</Box>
					)}
					<Box
						component='button'
						type='button'
						onClick={onClose}
						aria-label={closeLabel}
						sx={{
							background: 'none',
							border: '2px solid transparent',
							cursor: 'pointer',
							color: 'accentDark.warm',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							width: 48,
							height: 48,
							p: 0,
							flexShrink: 0,
							ml: 'auto',
							'&:hover': {
								color: 'ink.main',
								borderColor: 'ink.main',
							},
						}}
					>
						{closeIcon ?? <CloseIcon />}
					</Box>
				</Box>

				<Box
					component='nav'
					aria-label={navLabel}
					sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}
				>
					{links.map((link) => (
						<Box
							key={siteNavItemKey(link)}
							component={linkComponent}
							{...siteNavLinkProps(link)}
							onClick={onClose}
							sx={{
								display: 'flex',
								alignItems: 'center',
								gap: 2,
								minHeight: 48,
								px: 2,
								py: 1.5,
								textDecoration: 'none',
								fontFamily: '"Space Grotesk", sans-serif',
								fontSize: '0.875rem',
								fontWeight: 700,
								letterSpacing: '0.1em',
								textTransform: 'uppercase',
								transition: 'background 0.15s, color 0.15s',
								color: link.active ? 'accentDark.main' : 'accentDark.warm',
								bgcolor: link.active ? 'surface.muted' : 'transparent',
								borderLeft: '4px solid',
								borderColor: link.active ? 'accentDark.main' : 'transparent',
								'&:hover': {
									bgcolor: 'surface.muted',
									color: 'ink.main',
								},
							}}
						>
							<SiteNavItemContent {...link} />
						</Box>
					))}
				</Box>

				{footer ? <Box sx={{ mt: 'auto', pt: 3 }}>{footer}</Box> : null}
			</Box>
		</Box>
	);
};
