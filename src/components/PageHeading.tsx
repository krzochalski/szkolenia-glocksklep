import { Box, Typography } from '@ui';
import type { ReactNode } from 'react';

type PageHeadingProps = {
	readonly title: ReactNode;
	readonly description?: ReactNode;
};

/** Shared page title + mono description with rule — used on listing pages. */
export const PageHeading = ({ title, description }: PageHeadingProps) => (
	<Box
		sx={{
			borderBottom: '3px solid',
			borderColor: 'ink.main',
			pb: 1.5,
			mb: 3,
		}}
	>
		<Typography
			variant='h1'
			sx={{
				fontSize: { xs: '1.75rem', md: '2.5rem' },
				textTransform: 'uppercase',
				letterSpacing: '-0.02em',
			}}
		>
			{title}
		</Typography>
		{description ? (
			<Typography
				component='p'
				sx={{
					fontFamily: '"Space Mono", monospace',
					fontSize: '0.8125rem',
					color: 'text.secondary',
					mt: 2,
					mb: 0,
					lineHeight: 1.55,
				}}
			>
				{description}
			</Typography>
		) : null}
	</Box>
);
