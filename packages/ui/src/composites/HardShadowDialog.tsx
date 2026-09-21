import type { DialogProps } from '../primitives';
import { Dialog } from '../primitives';
import { brand } from '../theme';

export const hardShadowDialogPaperSx = {
	border: '3px solid',
	borderColor: 'ink.main',
	boxShadow: (theme: { palette: { ink: { main: string } } }) =>
		`6px 6px 0 0 ${theme.palette.ink.main}`,
	borderRadius: 0,
	maxHeight: '90vh',
	'&.MuiDialog-paperFullScreen': {
		maxHeight: '100%',
		boxShadow: 'none',
		borderLeft: 'none',
		borderRight: 'none',
		width: '100%',
		maxWidth: '100%',
		margin: 0,
	},
} as const;

export const hardShadowDialogTitleSx = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	px: { xs: 2, md: 4 },
	py: { xs: 2, md: 3 },
	borderBottom: '3px solid',
	borderColor: 'ink.main',
	fontFamily: '"Space Mono", monospace',
	fontWeight: 700,
	fontSize: { xs: '1rem', md: '1.25rem' },
	textTransform: 'uppercase',
	flexShrink: 0,
} as const;

export const hardShadowDialogContentSx = {
	p: { xs: 2, md: 4 },
	display: 'flex',
	flexDirection: 'column',
	gap: { xs: 1.25, md: 4 },
	overflowY: 'auto',
	flex: '1 1 auto',
} as const;

export const hardShadowDialogActionsSx = {
	px: { xs: 2, md: 4 },
	pt: { xs: 2, md: 3 },
	pb: {
		xs: 'max(1rem, env(safe-area-inset-bottom))',
		md: 'max(1.5rem, env(safe-area-inset-bottom))',
	},
	borderTop: '3px solid',
	borderColor: 'ink.main',
	flexShrink: 0,
	flexWrap: { xs: 'wrap', md: 'nowrap' },
} as const;

export const formOptionGroupSx = {
	display: 'flex',
	flexDirection: 'column',
	gap: 0.5,
	'& .MuiFormControlLabel-root': {
		ml: 0,
		border: '2px solid',
		borderColor: 'ink.main',
		px: 2,
		py: 1.5,
		transition: 'border-color 0.15s',
		fontFamily: '"Space Mono", monospace',
		'&:hover': { borderColor: 'primary.main' },
	},
	'& .MuiFormControlLabel-root:has(.Mui-checked)': {
		borderColor: 'primary.main',
		bgcolor: brand.primarySoft,
	},
	'& .MuiRadio-root.Mui-checked, & .MuiCheckbox-root.Mui-checked': {
		color: 'primary.main',
	},
} as const;

export const HardShadowDialog = ({ slotProps, ...props }: DialogProps) => {
	const paperSlot = slotProps?.paper;

	return (
		<Dialog
			{...props}
			slotProps={{
				...slotProps,
				paper: {
					...(paperSlot && typeof paperSlot === 'object' ? paperSlot : {}),
					sx: hardShadowDialogPaperSx,
				},
			}}
		/>
	);
};
