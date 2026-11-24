'use client';

import { usePublicDialogProps } from '@hooks';
import { HardShadowDialog, type DialogProps } from '@ui';

export const PublicDialog = ({ fullScreen, fullWidth, maxWidth, ...props }: DialogProps) => {
	const defaults = usePublicDialogProps({ fullScreen, fullWidth, maxWidth });
	return <HardShadowDialog {...defaults} {...props} />;
};