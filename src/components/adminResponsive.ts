import type { SxProps, Theme } from '@ui';

/** Minimum touch target per WCAG / mobile admin UX. */
export const adminTouchTargetSx = {
	minHeight: 44,
	minWidth: 44,
} as const;

export const adminIconButtonTouchSx: SxProps<Theme> = {
	width: 44,
	height: 44,
};

/** Participant / row action stacks on date detail screens. */
export const adminParticipantRowActionsSx = {
	flexWrap: 'wrap',
	gap: 1,
	'& .MuiButton-root': {
		minHeight: 44,
		alignSelf: { xs: 'stretch', sm: 'center' },
	},
	'& .MuiFormControlLabel-root': {
		minHeight: 44,
		ml: 0,
		mr: 0,
		alignSelf: { xs: 'stretch', sm: 'center' },
	},
};

export const adminMainPaneSx: SxProps<Theme> = {
	flex: 1,
	minWidth: 0,
	maxWidth: '100%',
	overflow: 'auto',
	overflowX: 'hidden',
};