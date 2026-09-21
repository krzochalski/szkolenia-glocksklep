'use client';

import { Paths } from '@constants/paths';
import { useAuthUser } from '@hooks';
import { getCourseBySlug, unenrollFromCourse } from '@services/courses';
import { getCourseDescriptionBySlug } from '@services/courseDescriptions';
import { fillPath } from '@/utils/paths';
import { Box, Button, CircularProgress, ConfirmDialog, Link, Stack, Typography } from '@ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import NextLink from 'next/link';
import { useState } from 'react';

type Props = {
	readonly slug: string;
	readonly dateId: string;
};

export const SzkolenieSzczegolyView = ({ slug, dateId }: Props) => {
	const user = useAuthUser();
	const queryClient = useQueryClient();
	const [confirmOpen, setConfirmOpen] = useState(false);

	const { data: course, isLoading } = useQuery({
		queryKey: ['course', slug],
		queryFn: () => getCourseBySlug(slug),
	});

	const { data: description } = useQuery({
		queryKey: ['courseDescription', slug],
		queryFn: () => getCourseDescriptionBySlug(slug),
	});

	const date = course?.dates?.find((d) => d.id === dateId);
	const participant = date?.participants?.find((p) => p.id === user?.uid);

	const unenroll = useMutation({
		mutationFn: async () => {
			if (!course || !user) throw new Error('Brak danych.');
			await unenrollFromCourse(course.id, dateId, user.uid);
		},
		onSuccess: async () => {
			setConfirmOpen(false);
			await queryClient.invalidateQueries({ queryKey: ['courses'] });
			await queryClient.invalidateQueries({ queryKey: ['course', slug] });
		},
	});

	if (isLoading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
				<CircularProgress />
			</Box>
		);
	}

	if (!course || !date) {
		return <Typography>Nie znaleziono terminu.</Typography>;
	}

	return (
		<Box>
			<Typography variant='h5' component='h1' gutterBottom>
				{course.name}
			</Typography>
			<Typography color='text.secondary' sx={{ mb: 2 }}>
				{date.date} · {date.timeStart} · {date.place?.name}
			</Typography>
			<Typography sx={{ mb: 2 }}>{course.description}</Typography>

			{description?.visibleInParticipantPanel?.includes('forWhom') ? (
				<Box sx={{ mb: 2 }}>
					<Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
						{description.forWhom?.heading ?? 'Dla kogo'}
					</Typography>
					<ul>
						{(description.forWhom?.items ?? []).map((item) => (
							<li key={item}>{item}</li>
						))}
					</ul>
				</Box>
			) : null}

			<Stack direction='row' spacing={2} sx={{ alignItems: 'center' }}>
				<Typography>
					Status płatności: {participant?.paid ? 'Opłacone' : 'Nieopłacone'}
					{participant?.paysByCash ? ' (gotówka)' : ''}
				</Typography>
				<Link
					component={NextLink}
					href={fillPath(Paths.proforma, { slug, dateId })}
				>
					Proforma
				</Link>
			</Stack>

			{participant ? (
				<>
					<Button
						sx={{ mt: 3 }}
						variant='outlined'
						color='error'
						disabled={unenroll.isPending}
						onClick={() => setConfirmOpen(true)}
					>
						Wypisz się
					</Button>
					<ConfirmDialog
						open={confirmOpen}
						title='Potwierdź wypisanie'
						cancelLabel='Anuluj'
						confirmLabel='Wypisz się'
						loading={unenroll.isPending}
						onCancel={() => setConfirmOpen(false)}
						onConfirm={() => unenroll.mutate()}
					>
						{`Czy na pewno chcesz wypisać się z „${course.name}” (${date.date})?`}
					</ConfirmDialog>
				</>
			) : (
				<Typography sx={{ mt: 2 }} color='text.secondary'>
					Nie jesteś zapisany na ten termin.
				</Typography>
			)}
		</Box>
	);
};
