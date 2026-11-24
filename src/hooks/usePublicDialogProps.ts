'use client';

import type { DialogProps } from '@ui';
import { usePhoneLayout } from './usePhoneLayout';

/** Full-screen dialogs on phones; keep explicit `fullScreen` when passed. */
export const usePublicDialogProps = (
	overrides?: Pick<DialogProps, 'fullScreen' | 'fullWidth' | 'maxWidth'>
): Pick<DialogProps, 'fullScreen' | 'fullWidth' | 'maxWidth'> => {
	const phone = usePhoneLayout();
	return {
		fullWidth: overrides?.fullWidth ?? true,
		maxWidth: overrides?.maxWidth ?? 'sm',
		fullScreen: overrides?.fullScreen ?? phone,
	};
};