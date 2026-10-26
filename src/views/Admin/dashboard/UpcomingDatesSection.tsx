'use client';

import { Paths } from '@constants/paths';
import type { UpcomingDateItem, UpcomingHorizonDays } from '@/utils/adminDashboard';
import { formatMinParticipantsMeta } from '@/utils/minParticipants';
import { fillPath } from '@/utils/paths';
import { Box, Button, Chip, Paper, Stack, Typography } from '@ui';
import NextLink from 'next/link';
import { SESSION_STATUS_LABEL, sessionStatusChipColor } from './sessionStatusLabel';

type Props = {
	readonly items: readonly UpcomingDateItem[];
	readonly days: UpcomingHorizonDays;
	readonly onDaysChange: (days: UpcomingHorizonDays) => void;
};

export const UpcomingDatesSection = ({ items, days, onDaysChange }: Props) => (
	<Box>
		<Stack
			direction={{ xs: 'column', sm: 'row' }}
			spacing={1}
			sx={{ mb: 1, alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
		>
			<Typography variant='h6' component='h2'>
				Nadchodzące terminy
			</Typography>
			<Stack direction='row' spacing={1}>
				<Button
					size='small'
					variant={days === 7 ? 'contained' : 'outlined'}
					onClick={() => onDaysChange(7)}
				>
					7 dni
				</Button>
				<Button
					size='small'
					variant={days === 30 ? 'contained' : 'outlined'}
					onClick={() => onDaysChange(30)}
				>
					30 dni
				</Button>
			</Stack>
		</Stack>
		<Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
			Szkolenia i treningi w wybranym horyzoncie (Europa/Warszawa).
		</Typography>
		{items.length === 0 ? (
			<Typography color='text.secondary'>Brak terminów w wybranym okresie.</Typography>
		) : (
			<Stack spacing={1.5}>
				{items.map((item) => (
					<Paper key={`${item.courseId}-${item.dateId}`} variant='outlined' sx={{ p: 2 }}>
						<Stack
							direction={{ xs: 'column', sm: 'row' }}
							spacing={1}
							sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
						>
							<Box sx={{ minWidth: 0 }}>
								<Stack direction='row' spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', mb: 0.5 }}>
									<Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
										{item.title}
									</Typography>
									<Chip label={item.kindLabel} size='small' variant='outlined' />
									<Chip
										label={SESSION_STATUS_LABEL[item.status]}
										size='small'
										color={sessionStatusChipColor(item.status)}
									/>
								</Stack>
								<Typography variant='body2' color='text.secondary'>
									{item.date} {item.timeStart}
									{item.placeName ? ` · ${item.placeName}` : ''}
									{` · ${item.signedUp}/${item.slotsMax} zapisanych`}
									{` · ${formatMinParticipantsMeta(item.signedUp, item.minParticipants)}`}
								</Typography>
							</Box>
							<Button
								component={NextLink}
								href={fillPath(Paths.adminCourseDates, {
									courseId: item.courseId,
									dateId: item.dateId,
								})}
								size='small'
								variant='outlined'
								sx={{ flexShrink: 0, alignSelf: { xs: 'stretch', sm: 'center' } }}
							>
								Szczegóły
							</Button>
						</Stack>
					</Paper>
				))}
			</Stack>
		)}
	</Box>
);
