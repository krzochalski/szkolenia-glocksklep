'use client';

import { Paths } from '@constants/paths';
import type { SignupsSpotlightItem } from '@/utils/adminDashboard';
import { fillPath } from '@/utils/paths';
import { Box, Button, Chip, Paper, Stack, Typography } from '@ui';
import NextLink from 'next/link';

type Props = {
	readonly items: readonly SignupsSpotlightItem[];
};

export const SignupsSpotlightSection = ({ items }: Props) => (
	<Box>
		<Typography variant='h6' component='h2' gutterBottom>
			Wymagają uwagi
		</Typography>
		<Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
			Terminy z najwyższym wypełnieniem — przypomnienia, lista oczekujących, nowe daty.
		</Typography>
		{items.length === 0 ? (
			<Typography color='text.secondary'>Brak nadchodzących terminów do obserwacji.</Typography>
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
										{item.courseName}
									</Typography>
									<Chip label={item.kindLabel} size='small' variant='outlined' />
									{item.nearFull ? (
										<Chip label='Prawie pełne' size='small' color='warning' />
									) : null}
								</Stack>
								<Typography variant='body2' color='text.secondary'>
									{item.date} {item.timeStart} · {item.signedUp}/{item.slotsMax} zapisanych
									{item.waitingListCount > 0
										? ` · lista oczekujących: ${item.waitingListCount}`
										: ''}
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
								Zarządzaj
							</Button>
						</Stack>
					</Paper>
				))}
			</Stack>
		)}
	</Box>
);
