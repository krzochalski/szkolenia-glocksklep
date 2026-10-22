'use client';

import { PAGE_CONTENT_MAX_WIDTH } from '@constants/layout';
import { Paths } from '@constants/paths';
import { useAuthUser } from '@hooks';
import { signOut } from '@services/auth';
import {
	AccountBottomNav,
	type AccountNavItem,
	AccountSidebar,
	accountNavContentPb,
	Box,
	Button,
} from '@ui';
import {
	CalendarMonthIcon,
	EventAvailableIcon,
	FitnessCenter,
	HowToRegIcon,
	MilitaryTechIcon,
	PersonOutlined,
} from '@ui/icons';
import NextLink from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';
import { withRedirectQuery } from '@/utils/paths';

const NAV = [
	{
		label: 'Profil',
		href: Paths.profil,
		exact: true,
		icon: PersonOutlined,
	},
	{
		label: 'Moje szkolenia',
		href: Paths.mojeShkolenia,
		exact: false,
		icon: EventAvailableIcon,
	},
	{
		label: 'Ścieżka',
		href: Paths.profilSciezkaRozwoju,
		exact: true,
		icon: MilitaryTechIcon,
	},
	{
		label: 'Po szkoleniu',
		href: Paths.profilDebriefing,
		exact: false,
		icon: FitnessCenter,
	},
	{
		label: 'Harmonogram',
		href: Paths.harmonogram,
		exact: false,
		icon: CalendarMonthIcon,
	},
	{
		label: 'Lista oczekujących',
		href: Paths.listaOczekujacych,
		exact: true,
		icon: HowToRegIcon,
	},
] as const;

type ProfilShellProps = {
	readonly children: ReactNode;
};

const isNavActive = (pathname: string, item: (typeof NAV)[number]) =>
	item.exact
		? pathname === item.href
		: pathname === item.href || pathname.startsWith(`${item.href}/`);

export const ProfilShell = ({ children }: ProfilShellProps) => {
	const user = useAuthUser();
	const pathname = usePathname();
	const router = useRouter();
	const [loggingOut, setLoggingOut] = useState(false);

	useEffect(() => {
		if (user) return;
		router.replace(withRedirectQuery(Paths.login, pathname || Paths.profil));
	}, [user, pathname, router]);

	if (!user) return null;

	const handleLogout = () => {
		if (loggingOut) return;
		setLoggingOut(true);
		void signOut()
			.then(() => {
				router.push(Paths.home);
			})
			.finally(() => setLoggingOut(false));
	};

	const items: AccountNavItem[] = NAV.map((item) => {
		const Icon = item.icon;
		return {
			href: item.href,
			label: item.label,
			active: isNavActive(pathname, item),
			icon: <Icon />,
		};
	});

	return (
		<Box sx={{ display: 'flex', gap: { md: 3 }, flex: 1, minHeight: 0 }}>
			<AccountSidebar
				title={user.displayName || 'Profil'}
				subtitle={user.email}
				linkComponent={NextLink}
				items={items}
				footer={
					<Button
						variant='text'
						color='inherit'
						fullWidth
						disabled={loggingOut}
						onClick={handleLogout}
						sx={{
							justifyContent: 'flex-start',
							px: 1.5,
							color: 'text.secondary',
							fontWeight: 500,
							textTransform: 'none',
							'&:hover': { color: 'ink.main', bgcolor: 'transparent' },
						}}
					>
						Wyloguj
					</Button>
				}
			/>
			<Box
				sx={{
					flex: 1,
					minWidth: 0,
					width: '100%',
					maxWidth: PAGE_CONTENT_MAX_WIDTH,
					pb: accountNavContentPb,
				}}
			>
				{children}
			</Box>
			<AccountBottomNav ariaLabel='Nawigacja profilu' linkComponent={NextLink} items={items} />
		</Box>
	);
};
