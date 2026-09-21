import { Box } from '../primitives';
import type { ReactNode } from 'react';
import { HardShadow } from './HardShadow';

type SelectableCardProps = {
	readonly onClick: () => void;
	readonly image: ReactNode;
	readonly title: ReactNode;
	readonly description?: ReactNode;
	readonly meta?: ReactNode;
};

export const SelectableCard = ({
	onClick,
	image,
	title,
	description,
	meta,
}: SelectableCardProps) => (
	<Box
		component='button'
		type='button'
		onClick={onClick}
		sx={{
			display: 'block',
			width: '100%',
			p: 0,
			m: 0,
			border: 'none',
			background: 'none',
			cursor: 'pointer',
			textAlign: 'left',
			font: 'inherit',
			color: 'inherit',
			appearance: 'none',
			WebkitAppearance: 'none',
			minHeight: 48,
			'&:focus-visible .option-card': {
				outline: '3px solid',
				outlineColor: 'primary.main',
				outlineOffset: 2,
			},
			'&:hover .option-card': {
				transform: 'translate(-2px, -2px)',
				boxShadow: (theme) => `8px 8px 0 0 ${theme.palette.ink.main}`,
			},
			'&:active .option-card': {
				transform: 'translate(2px, 2px)',
				boxShadow: (theme) => `3px 3px 0 0 ${theme.palette.ink.main}`,
			},
		}}
	>
		<HardShadow
			className='option-card'
			sx={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'stretch',
				p: 0,
				bgcolor: 'background.paper',
				transition: 'transform 120ms ease, box-shadow 120ms ease',
			}}
		>
			<Box
				sx={{
					borderBottom: '3px solid',
					borderColor: 'ink.main',
					bgcolor: 'surface.muted',
					aspectRatio: '16 / 10',
					overflow: 'hidden',
					position: 'relative',
				}}
			>
				{image}
			</Box>
			<Box sx={{ p: { xs: 2, md: 2.5 }, display: 'flex', flexDirection: 'column', gap: 1 }}>
				{title}
				{description}
				{meta}
			</Box>
		</HardShadow>
	</Box>
);
