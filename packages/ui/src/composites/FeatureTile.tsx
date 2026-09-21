import { Box, Typography } from '../primitives';
import type { ReactNode } from 'react';
import { HardShadow, MonoText } from './HardShadow';

type FeatureTileProps = {
	readonly icon: ReactNode;
	readonly iconBg?: string;
	readonly title: ReactNode;
	readonly description: ReactNode;
	readonly variant?: 'row' | 'card';
};

export const FeatureTile = ({
	icon,
	iconBg = 'primary.main',
	title,
	description,
	variant = 'row',
}: FeatureTileProps) => {
	const body = (
		<>
			<Box
				sx={{
					width: 48,
					height: 48,
					minWidth: 48,
					bgcolor: iconBg,
					mb: variant === 'card' ? 2 : 0,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				{icon}
			</Box>
			<Box>
				<Typography
					sx={{
						fontWeight: 700,
						fontSize: '1.25rem',
						textTransform: 'uppercase',
						mb: variant === 'card' ? 1 : 0.5,
					}}
				>
					{title}
				</Typography>
				{typeof description === 'string' ? <MonoText>{description}</MonoText> : description}
			</Box>
		</>
	);

	if (variant === 'card') {
		return (
			<HardShadow
				sx={{
					p: 3,
					bgcolor: 'background.paper',
					transition: 'background-color 0.2s',
					'&:hover': { bgcolor: 'surface.muted' },
					'&:active': {
						transform: 'translate(2px, 2px)',
						boxShadow: (theme) => `2px 2px 0 0 ${theme.palette.ink.main}`,
					},
				}}
			>
				{body}
			</HardShadow>
		);
	}

	return <Box sx={{ display: 'flex', gap: 2 }}>{body}</Box>;
};
