'use client';

import { completeGoogleRedirectSignIn } from '@services/auth';
import { queryClient } from '@services/queryClient';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { brand, UiProvider } from '@ui';
import { type ReactNode, useEffect } from 'react';
import { CookieConsent } from 'react-cookie-consent';

export const AppProviders = ({ children }: { readonly children: ReactNode }) => {
	useEffect(() => {
		void completeGoogleRedirectSignIn().catch(() => {
			/* ignore redirect noise */
		});
	}, []);

	return (
		<AppRouterCacheProvider>
			<UiProvider>
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
						Ta strona używa cookies, korzystając z niej zgadzasz się na korzystanie z nich.
					</CookieConsent>
				</QueryClientProvider>
			</UiProvider>
		</AppRouterCacheProvider>
	);
};
