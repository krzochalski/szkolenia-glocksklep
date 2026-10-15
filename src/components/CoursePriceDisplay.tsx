'use client';

import { Typography } from '@ui';
import { formatPlnNettoBrutto } from '@/utils/pricing';

type CoursePriceDisplayProps = {
	readonly price: number;
};

export const CoursePriceDisplay = ({ price }: CoursePriceDisplayProps) => (
	<Typography
		sx={{
			fontFamily: '"Space Mono", monospace',
			fontWeight: 700,
			fontSize: { xs: '1.25rem', md: '1.5rem' },
			letterSpacing: '0.02em',
		}}
	>
		{formatPlnNettoBrutto(price)}
	</Typography>
);
