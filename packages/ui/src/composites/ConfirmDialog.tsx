import type { ReactNode } from 'react';
import type { ButtonProps } from '../primitives';
import {
	Button,
	CircularProgress,
	DialogActions,
	DialogContent,
	DialogTitle,
	Typography,
} from '../primitives';
import {
	HardShadowDialog,
	hardShadowDialogActionsSx,
	hardShadowDialogContentSx,
	hardShadowDialogTitleSx,
} from './HardShadowDialog';

export type ConfirmDialogProps = {
	readonly open: boolean;
	readonly title: ReactNode;
	readonly children?: ReactNode;
	readonly cancelLabel: string;
	readonly confirmLabel: string;
	readonly confirmColor?: ButtonProps['color'];
	readonly loading?: boolean;
	readonly onCancel: () => void;
	readonly onConfirm: () => void;
};

export const ConfirmDialog = ({
	open,
	title,
	children,
	cancelLabel,
	confirmLabel,
	confirmColor = 'error',
	loading = false,
	onCancel,
	onConfirm,
}: ConfirmDialogProps) => (
	<HardShadowDialog open={open} onClose={loading ? undefined : onCancel} fullWidth maxWidth='sm'>
		<DialogTitle sx={hardShadowDialogTitleSx}>{title}</DialogTitle>
		<DialogContent sx={hardShadowDialogContentSx}>
			{typeof children === 'string' ? <Typography>{children}</Typography> : children}
		</DialogContent>
		<DialogActions sx={hardShadowDialogActionsSx}>
			<Button onClick={onCancel} disabled={loading} variant='outlined'>
				{cancelLabel}
			</Button>
			<Button variant='contained' color={confirmColor} onClick={onConfirm} disabled={loading}>
				{loading ? <CircularProgress size={16} color='inherit' /> : confirmLabel}
			</Button>
		</DialogActions>
	</HardShadowDialog>
);
