'use client';

import { useMediaQuery, useTheme } from '@ui';

/** Viewport below the `sm` breakpoint (~phone). */
export const useAdminPhoneLayout = () => {
	const theme = useTheme();
	return useMediaQuery(theme.breakpoints.down('sm'));
};

/** Viewport below `md` — sidebar hidden, drawer navigation. */
export const useAdminCompactLayout = () => {
	const theme = useTheme();
	return useMediaQuery(theme.breakpoints.down('md'));
};