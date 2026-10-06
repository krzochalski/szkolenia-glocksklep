'use client';

import { useSlowActionHint } from '@hooks/useSlowActionHint';
import { Box, Button, type ButtonProps, CircularProgress, MotionAlert } from '@ui';

type AuthBusyButtonProps = Omit<ButtonProps, 'children'> & {
	busy: boolean;
	label: string;
	busyLabel?: string;
	slowHint: string;
};

export const AuthBusyButton = ({
	busy,
	label,
	busyLabel,
	slowHint,
	disabled,
	...rest
}: AuthBusyButtonProps) => {
	const showSlow = useSlowActionHint(busy);

	return (
		<>
			<Button disabled={disabled || busy} {...rest}>
				{busy ? (
					<Box component='span' sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5 }}>
						<CircularProgress size={16} color='inherit' />
						{busyLabel ?? label}
					</Box>
				) : (
					label
				)}
			</Button>
			<MotionAlert show={showSlow} severity='info'>
				{slowHint}
			</MotionAlert>
		</>
	);
};
