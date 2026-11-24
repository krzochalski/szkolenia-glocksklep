'use client';

import type { DialogProps } from '@ui';
import { useAdminPhoneLayout } from './useAdminPhoneLayout';

/** Full-screen dialogs on phones; keep explicit `fullScreen` when passed. */
export const useAdminDialogProps = (
	overrides?: Pick<DialogProps, 'fullScreen' | 'fullWidth'>
): Pick<DialogProps, 'fullScreen' | 'fullWidth'> => {
	const phone = useAdminPhoneLayout();
	return {
		fullWidth: overrides?.fullWidth ?? true,
		fullScreen: overrides?.fullScreen ?? phone,
	};
};