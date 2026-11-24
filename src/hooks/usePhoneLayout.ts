'use client';

import { useMediaQuery, useTheme } from '@ui';

/** Viewport below the `sm` breakpoint (~phone). */
export const usePhoneLayout = () => {
	const theme = useTheme();
	return useMediaQuery(theme.breakpoints.down('sm'));
};