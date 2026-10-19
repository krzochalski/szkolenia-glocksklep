'use client';

import { Paths } from '@constants/paths';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { completeGoogleRedirectSignIn } from '@services/auth';
import { queryClient } from '@services/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { brand, UiProvider } from '@ui';
import NextLink from 'next/link';
import { type ReactNode, useEffect } from 'react';
import { CookieConsent } from 'react-cookie-consent';
import { PriceModeProvider } from '@/hooks';

export const AppProviders = ({ children }: { readonly children: ReactNode }) => {
	useEffect(() => {
		void completeGoogleRedirectSignIn().catch(() => {
			/* ignore redirect noise */
		});
	}, []);

	return (
		<AppRouterCacheProvider>
			<UiProvider>
				<PriceModeProvider>
					<QueryClientProvider client={queryClient}>
						{children}
						<CookieConsent
							buttonStyle={{
								color: brand.accentDark,
								background: 'transparent',
								fontSize: '1rem',
								border: `2px solid ${brand.accentDark}`,
								height: '3rem',
								minHeight: '48px',
								padding: '0 2rem',
							}}
							buttonText='Spoko'
							declineButtonText='Odrzuć'
							enableDeclineButton
							declineButtonStyle={{
								color: brand.ink,
								background: 'transparent',
								fontSize: '1rem',
								border: `2px solid ${brand.borderMuted}`,
								height: '3rem',
								minHeight: '48px',
								padding: '0 1.5rem',
								marginRight: '0.75rem',
							}}
							cookieName='cookiesConsent'
							expires={150}
							location='bottom'
							style={{
								color: brand.ink,
								background: brand.paper,
								borderTop: `2px solid ${brand.borderMuted}`,
								padding: 0,
								paddingBottom: 'env(safe-area-inset-bottom, 0px)',
								fontWeight: 'bold',
							}}
						>
							Ta strona używa cookies. Możesz zaakceptować albo odrzucić — wybór zapisujemy w cookie,
							żeby nie pytać przy każdej wizycie. Szczegóły:{' '}
							<NextLink
								href={Paths.politykaCookies}
								style={{ color: brand.accentDark, textDecoration: 'underline' }}
							>
								polityka cookies
							</NextLink>
							.
						</CookieConsent>
					</QueryClientProvider>
				</PriceModeProvider>
			</UiProvider>
		</AppRouterCacheProvider>
	);
};
