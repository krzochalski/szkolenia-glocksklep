'use client';

import { MarkdownContent } from '@components';
import { Paths } from '@constants/paths';
import { useAuthUser } from '@hooks';
import { getMyCourseCompletions } from '@services/courseCompletions';
import { getCourseDebriefing } from '@services/courseDebriefings';
import { formatDebriefingMeta } from '@/utils/debriefingMeta';
import { Box, Button, CircularProgress, ContentSwap, Stack, Typography } from '@ui';
import { ArrowBackIcon } from '@ui/icons';
import { useQuery } from '@tanstack/react-query';
import NextLink from 'next/link';
import { useMemo } from 'react';

type Props = {
	readonly courseId: string;
};

export const ProfilDebriefingDetailView = ({ courseId }: Props) => {
	const user = useAuthUser();
	const { data: completions = [], isLoading: completionsLoading } = useQuery({
		queryKey: ['myCourseCompletions'],
		queryFn: getMyCourseCompletions,
		enabled: Boolean(user),
	});

	const hasCompleted = useMemo(
		() => completions.some((c) => c.courseId === courseId),
		[completions, courseId]
	);

	const {
		data: debriefing,
		isLoading: debriefingLoading,
		isError,
	} = useQuery({
		queryKey: ['courseDebriefing', courseId],
		queryFn: () => getCourseDebriefing(courseId),
		enabled: Boolean(user) && hasCompleted,
		retry: false,
	});

	const isLoading = completionsLoading || (hasCompleted && debriefingLoading);
	const metaLabel = debriefing ? formatDebriefingMeta(debriefing) : null;

	return (
		<Box sx={{ maxWidth: 800 }}>
			<Button
				component={NextLink}
				href={Paths.profilDebriefing}
				startIcon={<ArrowBackIcon />}
				size='small'
				sx={{ mb: 2 }}
			>
				Po szkoleniu
			</Button>

			<ContentSwap
				state={
					isLoading ? 'loading' : !hasCompleted || isError || !debriefing ? 'empty' : 'content'
				}
			>
				{isLoading ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
						<CircularProgress />
					</Box>
				) : !hasCompleted ? (
					<Stack spacing={2} sx={{ py: 2 }}>
						<Typography sx={{ fontWeight: 600 }}>Brak dostępu</Typography>
						<Typography color='text.secondary'>
							Te materiały są dostępne tylko po oznaczeniu ukończenia szkolenia przez instruktora.
						</Typography>
						<Button
							component={NextLink}
							href={Paths.profilDebriefing}
							variant='outlined'
							sx={{ alignSelf: 'flex-start' }}
						>
							Wróć do listy
						</Button>
					</Stack>
				) : isError || !debriefing ? (
					<Stack spacing={2} sx={{ py: 2 }}>
						<Typography sx={{ fontWeight: 600 }}>Brak materiałów</Typography>
						<Typography color='text.secondary'>
							Debriefing dla tego szkolenia nie jest jeszcze opublikowany.
						</Typography>
						<Button
							component={NextLink}
							href={Paths.profilDebriefing}
							variant='outlined'
							sx={{ alignSelf: 'flex-start' }}
						>
							Wróć do listy
						</Button>
					</Stack>
				) : (
					<>
						<Typography variant='h4' component='h1' gutterBottom>
							{debriefing.courseName}
						</Typography>
						<Typography color='text.secondary' sx={{ mb: 0.5 }}>
							Debriefing — plan zajęć i ćwiczenia dodatkowe
						</Typography>
						{metaLabel ? (
							<Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
								{metaLabel}
							</Typography>
						) : (
							<Box sx={{ mb: 3 }} />
						)}
						<MarkdownContent content={debriefing.content} />
					</>
				)}
			</ContentSwap>
		</Box>
	);
};
