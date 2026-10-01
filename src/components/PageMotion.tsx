'use client';

import { FadeIn, Presence } from '@ui';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

type PageMotionProps = {
	readonly children: ReactNode;
};

/** App-owned route enter/exit — Next pathname stays out of the design system. */
export const PageMotion = ({ children }: PageMotionProps) => {
	const pathname = usePathname();

	return (
		<Presence mode='wait'>
			<FadeIn key={pathname} variant='fade' exit>
				{children}
			</FadeIn>
		</Presence>
	);
};
