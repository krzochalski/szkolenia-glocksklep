'use client';

import { usePriceMode } from '@hooks';
import { Box, PriceToggle, Typography } from '@ui';
import { formatCoursePrice } from '@/utils/pricing';

type CoursePriceDisplayProps = {
	readonly price: number;
};

export const CoursePriceDisplay = ({ price }: CoursePriceDisplayProps) => {
	const { mode, setMode } = usePriceMode();

	return (
		<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
			<Typography
				sx={{
					fontFamily: '"Space Mono", monospace',
					fontWeight: 700,
					fontSize: { xs: '1.25rem', md: '1.5rem' },
					letterSpacing: '0.02em',
				}}
			>
				{formatCoursePrice(price, mode)}
			</Typography>
			<PriceToggle mode={mode} onChange={setMode} />
		</Box>
	);
};
