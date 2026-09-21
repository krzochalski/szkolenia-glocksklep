import { Box, Typography } from '@ui';
import type { CourseModule } from './CourseLayout.types';

export const ModuleCard = ({ icon, title, desc }: CourseModule) => (
	<Box
		sx={{
			bgcolor: 'background.subtle',
			p: 3,
			borderLeft: '2px solid',
			borderColor: 'primary.main',
			display: 'flex',
			flexDirection: 'column',
			gap: 1.5,
			height: '100%',
			transition: 'border-color 0.2s',
			'&:hover': { borderColor: 'ink.main' },
		}}
	>
		<Box sx={{ color: 'primary.main' }}>{icon}</Box>
		<Typography
			sx={{
				fontFamily: '"Space Mono", monospace',
				fontSize: '0.625rem',
				fontWeight: 700,
				letterSpacing: '0.2em',
				textTransform: 'uppercase',
			}}
		>
			{title}
		</Typography>
		<Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', lineHeight: 1.7 }}>
			{desc}
		</Typography>
	</Box>
);
