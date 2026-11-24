import type { SxProps, Theme } from '@ui';

/** Minimum touch target for public CTAs on phones. */
export const publicTouchTargetSx = {
	minHeight: 44,
} as const;

export const publicMainColumnSx: SxProps<Theme> = {
	flex: 1,
	minWidth: 0,
	maxWidth: '100%',
	overflowX: 'hidden',
};

/** Enroll / auth dialog action rows: stack on phones. */
export const publicDialogActionsStackSx: SxProps<Theme> = {
	flexDirection: { xs: 'column', sm: 'row' },
	alignItems: { xs: 'stretch', sm: 'center' },
	gap: 1.5,
	'& .MuiButton-root': {
		...publicTouchTargetSx,
		width: { xs: '100%', sm: 'auto' },
	},
};