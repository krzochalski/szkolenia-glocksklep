'use client';

import { Paths } from '@constants/paths';
import { useAuthUser } from '@hooks';
import {
	getUserWaitingListEntries,
	removeFromWaitingList,
} from '@services/courseWaitingList';
import { fillPath } from '@/utils/paths';
import { Box, Button, CircularProgress, Link, Paper, Stack, Typography } from '@ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import NextLink from 'next/link';

export const ListaOczekujacychView = () => {
	const user = useAuthUser();
	const queryClient = useQueryClient();

	const uid = user?.uid;

	const { data: entries = [], isLoading } = useQuery({
		queryKey: ['waitingList', uid],
		queryFn: () => {
			if (!uid) return Promise.resolve([]);
			return getUserWaitingListEntries(uid);
		},
		enabled: Boolean(uid),
	});

	const remove = useMutation({
		mutationFn: (courseId: string) => {
			if (!uid) throw new Error('Brak użytkownika.');
			return removeFromWaitingList(courseId, uid);
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['waitingList', uid] });
		},
	});

	if (isLoading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Box>
			<Typography variant='h5' component='h1' gutterBottom>
				Lista oczekujących
			</Typography>
			<Stack spacing={2}>
				{entries.map((entry) => (
					<Paper key={entry.id} variant='outlined' sx={{ p: 2 }}>
						<Link
							component={NextLink}
							href={fillPath(Paths.coursePage, { slug: entry.courseSlug })}
							underline='hover'
							variant='subtitle1'
						>
							{entry.courseName}
						</Link>
						<Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>
							Dodano: {new Date(entry.createdAt).toLocaleString('pl-PL')}
						</Typography>
						<Button
							sx={{ mt: 1 }}
							size='small'
							variant='outlined'
							color='error'
							disabled={remove.isPending}
							onClick={() => remove.mutate(entry.courseId)}
						>
							Usuń
						</Button>
					</Paper>
				))}
				{entries.length === 0 ? (
					<Typography color='text.secondary'>Nie jesteś na żadnej liście oczekujących.</Typography>
				) : null}
			</Stack>
		</Box>
	);
};
