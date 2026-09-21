'use client';

import { Paths } from '@constants/paths';
import { useAuthUser } from '@hooks';
import { signOut } from '@services/auth';
import { Box, Button, ConfirmDialog, Link, Stack, Typography } from '@ui';
import NextLink from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useState } from 'react';

const NAV = [
	{ label: 'Profil', href: Paths.profil, exact: true },
	{ label: 'Moje szkolenia', href: Paths.mojeShkolenia, exact: false },
	{ label: 'Harmonogram', href: Paths.harmonogram, exact: false },
	{ label: 'Lista oczekujących', href: Paths.listaOczekujacych, exact: true },
] as const;

type ProfilShellProps = {
	readonly children: ReactNode;
};

export const ProfilShell = ({ children }: ProfilShellProps) => {
	const user = useAuthUser();
	const pathname = usePathname();
	const router = useRouter();
	const [logoutOpen, setLogoutOpen] = useState(false);
	const [loggingOut, setLoggingOut] = useState(false);

	if (!user) {
		return (
			<Box sx={{ textAlign: 'center' }}>
				<Typography sx={{ mb: 2 }}>Zaloguj się, aby zobaczyć profil.</Typography>
				<Button component={NextLink} href={Paths.login} variant='contained'>
					Zaloguj
				</Button>
			</Box>
		);
	}

	return (
		<Box sx={{ display: 'flex', gap: { md: 3 }, alignItems: 'flex-start' }}>
			<Box
				component='aside'
				sx={{
					width: 240,
					flexShrink: 0,
					borderRight: 1,
					borderColor: 'divider',
					pr: 2,
					display: { xs: 'none', md: 'flex' },
					flexDirection: 'column',
					gap: 1,
				}}
			>
				<Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
					{user.displayName || 'Profil'}
				</Typography>
				<Typography variant='caption' color='text.secondary' sx={{ mb: 2 }}>
					{user.email}
				</Typography>
				<Stack component='nav' spacing={0.5} sx={{ flex: 1 }}>
					{NAV.map((item) => {
						const active = item.exact
							? pathname === item.href
							: pathname === item.href || pathname.startsWith(`${item.href}/`);
						return (
							<Link
								key={item.href}
								component={NextLink}
								href={item.href}
								underline='none'
								sx={{
									px: 1.5,
									py: 1,
									borderRadius: 1,
									fontSize: '0.875rem',
									fontWeight: active ? 700 : 500,
									color: active ? 'primary.main' : 'text.secondary',
									bgcolor: active ? 'action.hover' : 'transparent',
								}}
							>
								{item.label}
							</Link>
						);
					})}
				</Stack>
				<Button variant='contained' onClick={() => setLogoutOpen(true)}>
					Wyloguj
				</Button>
			</Box>
			<Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
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
							router.push(Paths.home);
						})
						.finally(() => setLoggingOut(false));
				}}
			>
				Czy na pewno chcesz się wylogować?
			</ConfirmDialog>
		</Box>
	);
};
