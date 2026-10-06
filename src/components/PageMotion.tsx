'use client';

import { Paths } from '@constants/paths';
import { FadeIn, Presence } from '@ui';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

type PageMotionProps = {
	readonly children: ReactNode;
};

const isProfilPath = (pathname: string) =>
	pathname === Paths.profil || pathname.startsWith(`${Paths.profil}/`);

/** App-owned route enter/exit — Next pathname stays out of the design system. */
export const PageMotion = ({ children }: PageMotionProps) => {
	const pathname = usePathname();

	// Profile shell stays mounted; full-page fade makes the main pane flicker between tabs.
	if (isProfilPath(pathname)) {
		return children;
	}

	return (
		<Presence mode='wait'>
			<FadeIn key={pathname} variant='fade' exit>
				{children}
			</FadeIn>
		</Presence>
	);
};
