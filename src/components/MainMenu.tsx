'use client';

import { isCurrentPath, navigationItems } from '@constants/nav';
import { Paths } from '@constants/paths';
import { useAuthUser } from '@hooks';
import { signOut } from '@services/auth';
import { Box, ConfirmDialog, SiteNavDrawer } from '@ui';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

type MainMenuProps = {
	readonly open: boolean;
	readonly onClose: () => void;
};

const footerLinkSx = {
	display: 'flex',
	alignItems: 'center',
	minHeight: 48,
	px: 2,
	py: 1.5,
	textDecoration: 'none',
	fontFamily: '"Space Grotesk", sans-serif',
	fontSize: '0.875rem',
	fontWeight: 700,
	letterSpacing: '0.1em',
	textTransform: 'uppercase',
	color: 'accentDark.warm',
	border: 'none',
	background: 'none',
	cursor: 'pointer',
	textAlign: 'left',
	width: '100%',
	'&:hover': {
		bgcolor: 'surface.muted',
		color: 'ink.main',
	},
} as const;

export const MainMenu = ({ open, onClose }: MainMenuProps) => {
	const pathname = usePathname();
	const user = useAuthUser();
	const [logoutOpen, setLogoutOpen] = useState(false);
	const [loggingOut, setLoggingOut] = useState(false);

	return (
		<>
			<SiteNavDrawer
				open={open}
				onClose={onClose}
				linkComponent={NextLink}
				ariaLabel='Menu'
				closeLabel='Zamknij nawigację'
				links={navigationItems.map(({ label, path, external }) => ({
					href: path,
					label,
					active: !external && isCurrentPath(pathname, path),
					external,
				}))}
				footer={
					<Box sx={{ display: 'flex', flexDirection: 'column' }}>
						<Box
							component={NextLink}
							href={user ? Paths.profil : Paths.login}
							onClick={onClose}
							sx={footerLinkSx}
						>
							{user ? 'Profil' : 'Zaloguj'}
						</Box>
						{user ? (
							<Box
								component='button'
								type='button'
								onClick={() => setLogoutOpen(true)}
								sx={footerLinkSx}
							>
								Wyloguj
							</Box>
						) : (
							<Box
								component={NextLink}
								href={Paths.register}
								onClick={onClose}
								sx={footerLinkSx}
							>
								Rejestracja
							</Box>
						)}
					</Box>
				}
			/>
			<ConfirmDialog
				open={logoutOpen}
				title='Potwierdź wylogowanie'
				cancelLabel='Anuluj'
				confirmLabel='Wyloguj'
				confirmColor='primary'
				loading={loggingOut}
				onCancel={() => setLogoutOpen(false)}
				onConfirm={() => {
					setLoggingOut(true);
					void signOut()
						.then(() => {
							setLogoutOpen(false);
							onClose();
						})
						.finally(() => setLoggingOut(false));
				}}
			>
				Czy na pewno chcesz się wylogować?
			</ConfirmDialog>
		</>
	);
};
