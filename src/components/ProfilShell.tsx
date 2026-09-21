'use client';

import { Paths } from '@constants/paths';
import { useAuthUser } from '@hooks';
import { signOut } from '@services/auth';
import { Box, Button, Link, Stack, Typography } from '@ui';
import NextLink from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

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

	if (!user) {
		return (
			<Box sx={{ p: 4, textAlign: 'center' }}>
				<Typography sx={{ mb: 2 }}>Zaloguj się, aby zobaczyć profil.</Typography>
				<Button component={NextLink} href={Paths.login} variant='contained'>
					Zaloguj
				</Button>
			</Box>
		);
	}

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
				<Button
					variant='contained'
					onClick={async () => {
						await signOut();
						router.push(Paths.home);
					}}
				>
					Wyloguj
				</Button>
			</Box>
			<Box component='main' sx={{ flex: 1, p: { xs: 2, md: 3 } }}>
				{children}
			</Box>
		</Box>
	);
};
