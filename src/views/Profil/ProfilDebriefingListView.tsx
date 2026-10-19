'use client';

import { Paths } from '@constants/paths';
import { useAuthUser } from '@hooks';
import { getMyCourseCompletions } from '@services/courseCompletions';
import { getMyCourseDebriefings } from '@services/courseDebriefings';
import { formatDebriefingMeta } from '@/utils/debriefingMeta';
import { fillPath } from '@/utils/paths';
import {
	Box,
	Button,
	CircularProgress,
	ContentSwap,
	Paper,
	Stack,
	Stagger,
	StaggerItem,
	Typography,
} from '@ui';
import { useQuery } from '@tanstack/react-query';
import NextLink from 'next/link';

export const ProfilDebriefingListView = () => {
	const user = useAuthUser();
	const { data: completions = [], isLoading: completionsLoading } = useQuery({
		queryKey: ['myCourseCompletions'],
		queryFn: getMyCourseCompletions,
		enabled: Boolean(user),
	});
	const { data: debriefings = [], isLoading: debriefingsLoading } = useQuery({
		queryKey: ['myCourseDebriefings'],
		queryFn: getMyCourseDebriefings,
		enabled: Boolean(user),
	});

	const isLoading = completionsLoading || debriefingsLoading;
	const hasCompletions = completions.length > 0;

	return (
		<Box>
			<Typography variant='h4' component='h1' gutterBottom>
				Po szkoleniu
			</Typography>
			<Typography color='text.secondary' sx={{ mb: 3, maxWidth: 560 }}>
				Plan zajęć i ćwiczenia dodatkowe po ukończonych szkoleniach. Dostęp po oznaczeniu ukończenia
				przez instruktora.
			</Typography>

			<ContentSwap state={isLoading ? 'loading' : debriefings.length === 0 ? 'empty' : 'content'}>
				{isLoading ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
						<CircularProgress />
					</Box>
				) : debriefings.length === 0 ? (
					<Box sx={{ py: 2 }}>
						<Typography sx={{ fontWeight: 600, mb: 1 }}>
							{hasCompletions
								? 'Brak opublikowanych materiałów'
								: 'Nie masz jeszcze ukończonych szkoleń'}
						</Typography>
						<Typography color='text.secondary'>
							{hasCompletions
								? 'Ukończyłeś szkolenie, ale debriefing nie został jeszcze dodany. Sprawdź później.'
								: 'Gdy instruktor oznaczy szkolenie jako ukończone, pojawi się tu plan zajęć i ćwiczenia.'}
						</Typography>
					</Box>
				) : (
					<Stagger sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
						{debriefings.map((item) => {
							const metaLabel = formatDebriefingMeta(item);
							return (
								<StaggerItem key={item.courseId}>
									<Paper variant='outlined' sx={{ p: 2 }}>
										<Stack
											direction={{ xs: 'column', sm: 'row' }}
											sx={{
												alignItems: { sm: 'center' },
												justifyContent: 'space-between',
												gap: 1.5,
											}}
										>
											<Box>
												<Typography sx={{ fontWeight: 600 }}>{item.courseName}</Typography>
												<Typography variant='body2' color='text.secondary'>
													Plan zajęć i ćwiczenia dodatkowe
													{metaLabel ? ` · ${metaLabel}` : ''}
												</Typography>
											</Box>
											<Button
												variant='contained'
												component={NextLink}
												href={fillPath(Paths.profilDebriefingDetail, {
													courseId: item.courseId,
												})}
											>
												Otwórz
											</Button>
										</Stack>
									</Paper>
								</StaggerItem>
							);
						})}
					</Stagger>
				)}
			</ContentSwap>
		</Box>
	);
};
