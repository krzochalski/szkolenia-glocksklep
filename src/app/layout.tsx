import {
	DEFAULT_DESCRIPTION,
	DEFAULT_TITLE,
	SITE_ORIGIN,
} from '@constants/seo';
import { staticPageMetadata } from '@seo/pageMetadata';
import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, Space_Mono } from 'next/font/google';
import type { ReactNode } from 'react';

import { AppProviders } from './providers';

import './globals.css';

const spaceGrotesk = Space_Grotesk({
	subsets: ['latin', 'latin-ext'],
	variable: '--font-headline',
	display: 'swap',
});

const spaceMono = Space_Mono({
	subsets: ['latin', 'latin-ext'],
	weight: ['400', '700'],
	variable: '--font-mono',
	display: 'swap',
});

const gsc = process.env.NEXT_PUBLIC_GSC_VERIFICATION;

export const metadata: Metadata = {
	...staticPageMetadata('home'),
	metadataBase: new URL(SITE_ORIGIN),
	title: {
		default: DEFAULT_TITLE,
		template: `%s | Szkolenia Glocksklep`,
	},
	description: DEFAULT_DESCRIPTION,
	icons: {
		icon: [{ url: '/favicon.ico' }],
	},
	verification: gsc ? { google: gsc } : undefined,
};

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	viewportFit: 'cover',
	themeColor: [
		{ media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
		{ media: '(prefers-color-scheme: dark)', color: '#121212' },
	],
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
	return (
		<html
			className={`${spaceGrotesk.className} ${spaceGrotesk.variable} ${spaceMono.variable}`}
			lang='pl'
		>
			<body>
				<AppProviders>{children}</AppProviders>
			</body>
		</html>
	);
}
