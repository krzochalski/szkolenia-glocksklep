'use client';

import { isCurrentPath, navigationItems } from '@constants/nav';
import { Paths } from '@constants/paths';
import { useAuthUser } from '@hooks';
import { withRedirectQuery } from '@/utils/paths';
import { IconButton, SiteHeader as UiSiteHeader } from '@ui';
import { PersonOutlined } from '@ui/icons';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { MainMenu } from './MainMenu';

const ProfileButton = () => {
	const user = useAuthUser();
	const pathname = usePathname();
	const href = user
		? Paths.profil
		: withRedirectQuery(Paths.login, pathname || Paths.home);

	return (
		<IconButton
			component={NextLink}
			href={href}
			aria-label={user ? 'Profil' : 'Zaloguj'}
			sx={{ color: 'primary.main', width: 48, height: 48 }}
		>
			<PersonOutlined />
		</IconButton>
	);
};

export const SiteHeader = () => {
	const pathname = usePathname();
	const [menuOpen, setMenuOpen] = useState(false);

	const links = navigationItems.map(({ label, path, external }) => ({
		href: path,
		label,
		active: !external && isCurrentPath(pathname, path),
		external,
	}));

	return (
		<>
			<UiSiteHeader
				brand='GLOCKSKLEP'
				brandSublabel='Szkolenia'
				brandHref={Paths.home}
				linkComponent={NextLink}
				navLabel='Główna nawigacja'
				links={links}
				actions={<ProfileButton />}
				mobileActions={<ProfileButton />}
				onOpenMenu={() => setMenuOpen(true)}
				menuOpen={menuOpen}
				menuLabel='Otwórz nawigację'
			/>
			<MainMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
		</>
	);
};
