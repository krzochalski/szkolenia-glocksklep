'use client';

import { isCurrentPath, navigationItems } from '@constants/nav';
import { Paths } from '@constants/paths';
import { IconButton, SiteHeader as UiSiteHeader } from '@ui';
import { PersonOutlined } from '@ui/icons';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { MainMenu } from './MainMenu';

const ProfileButton = () => (
	<IconButton
		component={NextLink}
		href={Paths.profil}
		aria-label='Profil'
		sx={{ color: 'primary.main', width: 48, height: 48 }}
	>
		<PersonOutlined />
	</IconButton>
);

export const SiteHeader = () => {
	const pathname = usePathname();
	const [menuOpen, setMenuOpen] = useState(false);

	const links = navigationItems.map(({ label, path }) => ({
		href: path,
		label,
		active: isCurrentPath(pathname, path),
	}));

	return (
		<>
			<UiSiteHeader
				brand='GLOCKACCI'
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
