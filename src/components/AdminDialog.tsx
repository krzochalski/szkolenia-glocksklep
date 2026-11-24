'use client';

import { useAdminDialogProps } from '@hooks/useAdminDialogProps';
import { HardShadowDialog, type DialogProps } from '@ui';

export const AdminDialog = ({ fullScreen, fullWidth, ...props }: DialogProps) => {
	const defaults = useAdminDialogProps({ fullScreen, fullWidth });
	return <HardShadowDialog {...defaults} {...props} />;
};