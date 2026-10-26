'use client';

import type { MonthlyRevenueItem } from '@/utils/adminDashboard';
import { formatMonthLabelPl, maxRevenueBrutto } from '@/utils/adminDashboard';
import { Box, Button, Paper, Price, Stack, Typography } from '@ui';

export type RevenueRange =
	| { readonly mode: 'rolling' }
	| { readonly mode: 'year'; readonly year: number };

type Props = {
	readonly items: readonly MonthlyRevenueItem[];
	readonly range: RevenueRange;
	readonly yearOptions: readonly number[];
	readonly onRangeChange: (range: RevenueRange) => void;
};

export const MonthlyRevenueSection = ({ items, range, yearOptions, onRangeChange }: Props) => {
	const maxBrutto = maxRevenueBrutto(items);
	const totalNetto = items.reduce((sum, row) => sum + row.netto, 0);
	const totalBrutto = items.reduce((sum, row) => sum + row.brutto, 0);
	const hasAny = totalNetto > 0;

	return (
		<Box>
			<Stack
				direction={{ xs: 'column', sm: 'row' }}
				spacing={1}
				sx={{ mb: 1, alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
			>
				<Typography variant='h6' component='h2'>
					Przychód miesięczny (opłacone zapisy)
				</Typography>
				<Stack direction='row' spacing={1} sx={{ flexWrap: 'wrap' }}>
					<Button
						size='small'
						variant={range.mode === 'rolling' ? 'contained' : 'outlined'}
						onClick={() => onRangeChange({ mode: 'rolling' })}
					>
						12 mies.
					</Button>
					{yearOptions.map((year) => (
						<Button
							key={year}
							size='small'
							variant={range.mode === 'year' && range.year === year ? 'contained' : 'outlined'}
							onClick={() => onRangeChange({ mode: 'year', year })}
						>
							{year}
						</Button>
					))}
				</Stack>
			</Stack>
			<Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
				Suma cen netto za uczestników z flagą „opłacone”, według daty terminu. Kwoty brutto: VAT 23%.
			</Typography>

			{!hasAny ? (
				<Typography color='text.secondary'>Brak opłaconych zapisów w wybranym okresie.</Typography>
			) : (
				<>
					<Stack direction='row' spacing={2} sx={{ mb: 2, alignItems: 'baseline', flexWrap: 'wrap' }}>
						<Typography variant='body2' color='text.secondary'>
							Suma okresu:
						</Typography>
						<Price gross={totalBrutto} net={totalNetto} size='md' />
					</Stack>
					<Stack spacing={1.25}>
						{items.map((row) => {
							const widthPct = maxBrutto > 0 ? Math.round((row.brutto / maxBrutto) * 100) : 0;
							return (
								<Paper key={row.month} variant='outlined' sx={{ p: 1.5 }}>
									<Stack
										direction={{ xs: 'column', sm: 'row' }}
										spacing={1}
										sx={{ alignItems: { sm: 'center' } }}
									>
										<Typography
											variant='body2'
											sx={{
												fontWeight: 600,
												minWidth: { sm: 96 },
												textTransform: 'capitalize',
											}}
										>
											{formatMonthLabelPl(row.month)}
										</Typography>
										<Box
											sx={{
												flex: 1,
												height: 12,
												bgcolor: 'action.hover',
												border: '1px solid',
												borderColor: 'divider',
												minWidth: 0,
											}}
										>
											<Box
												sx={{
													height: '100%',
													width: `${widthPct}%`,
													bgcolor: 'primary.main',
													minWidth: row.brutto > 0 ? 4 : 0,
													transition: 'width 0.2s ease',
												}}
											/>
										</Box>
										<Box sx={{ flexShrink: 0 }}>
											<Price gross={row.brutto} net={row.netto} size='sm' />
										</Box>
									</Stack>
								</Paper>
							);
						})}
					</Stack>
				</>
			)}
		</Box>
	);
};
