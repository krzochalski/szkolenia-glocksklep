'use client';

import { Box, formatCurrencyAmount, Price, Typography } from '@ui';
import { bruttoFromNetto } from '@/utils/pricing';

type CoursePriceDisplayProps = {
	readonly price: number;
	/** When set, shows individual vs list price caption. */
	readonly individual?: boolean;
	readonly listPrice?: number;
};

/** Course detail price: stored netto → DS Price (brutto primary). */
export const CoursePriceDisplay = ({
	price,
	individual = false,
	listPrice,
}: CoursePriceDisplayProps) => (
	<Box>
		{individual ? (
			<Typography
				variant='caption'
				sx={{
					display: 'block',
					mb: 0.5,
					fontFamily: '"Space Mono", monospace',
					fontWeight: 700,
					letterSpacing: 0.06,
					textTransform: 'uppercase',
					color: 'primary.main',
				}}
			>
				Cena indywidualna
			</Typography>
		) : null}
		<Price gross={bruttoFromNetto(price)} net={price} size='lg' />
		{individual && listPrice != null && listPrice !== price ? (
			<Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 0.5 }}>
				Cena z listy: {formatCurrencyAmount(bruttoFromNetto(listPrice))} brutto
			</Typography>
		) : null}
	</Box>
);
