'use client';

import { ProfilShell, SiteFooter, SiteHeader } from '@components';
import { publicMainColumnSx } from '@components/publicResponsive';
import { Paths } from '@constants/paths';
import { Box, PageColumn } from '@ui';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

type PublicLayoutProps = {
	readonly children: ReactNode;
};

const isProfilPath = (pathname: string | null) =>
	pathname === Paths.profil || Boolean(pathname?.startsWith(`${Paths.profil}/`));

/** Keeps ProfilShell above `(public)/template` so the aside does not remount on in-profil nav. */
const PublicBody = ({ children }: PublicLayoutProps) => {
	const pathname = usePathname();
	if (isProfilPath(pathname)) {
		return <ProfilShell>{children}</ProfilShell>;
	}
	return children;
};

export default function PublicLayout({ children }: PublicLayoutProps) {
	const pathname = usePathname();
	const hideFooterForProfilNav = isProfilPath(pathname);

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				minHeight: '100vh',
				minWidth: 0,
				maxWidth: '100%',
				overflowX: 'hidden',
			}}
		>
			<SiteHeader />
			<PageColumn component='main' sx={publicMainColumnSx}>
				<PublicBody>{children}</PublicBody>
			</PageColumn>
			<SiteFooter
				sx={
					hideFooterForProfilNav
						? { display: { xs: 'none', md: 'block' } }
						: undefined
				}
			/>
		</Box>
	);
};
