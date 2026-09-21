'use client';

import { Paths } from '@constants/paths';
import { signOut } from '@services/auth';
import { Box, Button, ConfirmDialog, Link, Stack, Typography } from '@ui';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode, useState } from 'react';

const NAV = [
	{ label: 'Najbliższe terminy', href: Paths.adminNearestDates },
	{ label: 'Szkolenia', href: Paths.adminCourses },
	{ label: 'Uczestnicy', href: Paths.adminParticipants },
	{ label: 'Lista oczekujących', href: Paths.adminWaitingList },
	{ label: 'Opisy szkoleń', href: Paths.adminCourseDescriptions },
	{ label: 'Dane rozliczeniowe', href: Paths.adminBillingData },
	{ label: 'FAQ', href: Paths.adminFaq },
	{ label: 'Regulamin', href: Paths.adminRegulamin },
	{ label: 'Ścieżka rozwoju', href: Paths.adminSciezkaRozwoju },
	{ label: 'Obiekty', href: Paths.adminPlaces },
	{ label: 'Tagi', href: Paths.adminTags },
] as const;

type AdminShellProps = {
	readonly children: ReactNode;
};

export const AdminShell = ({ children }: AdminShellProps) => {
	const pathname = usePathname();
	const [logoutOpen, setLogoutOpen] = useState(false);
	const [loggingOut, setLoggingOut] = useState(false);

	return (
		<Box sx={{ display: 'flex', minHeight: '100vh' }}>
			<Box
				component='aside'
				sx={{
					width: 240,
					flexShrink: 0,
					borderRight: 1,
					borderColor: 'divider',
					p: 2,
					display: { xs: 'none', md: 'flex' },
					flexDirection: 'column',
					gap: 1,
					bgcolor: 'background.paper',
				}}
			>
				<Typography variant='subtitle1' sx={{ mb: 1, fontWeight: 700 }}>
					Admin
				</Typography>
				<Stack component='nav' spacing={0.5} sx={{ flex: 1 }}>
					{NAV.map((item) => {
						const active =
							pathname === item.href || pathname.startsWith(`${item.href}/`);
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
									bgcolor: active ? 'action.selected' : 'transparent',
								}}
							>
								{item.label}
							</Link>
						);
					})}
				</Stack>
				<Button component={NextLink} href={Paths.home} size='small' variant='outlined'>
					Strona główna
				</Button>
				<Button size='small' variant='text' onClick={() => setLogoutOpen(true)}>
					Wyloguj
				</Button>
			</Box>
			<Box component='main' sx={{ flex: 1, p: { xs: 2, md: 3 }, overflow: 'auto' }}>
				{children}
			</Box>
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
						.then(() => setLogoutOpen(false))
						.finally(() => setLoggingOut(false));
				}}
			>
				Czy na pewno chcesz się wylogować?
			</ConfirmDialog>
		</Box>
	);
};
