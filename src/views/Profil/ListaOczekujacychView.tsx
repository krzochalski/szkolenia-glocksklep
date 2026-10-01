'use client';

import { Paths } from '@constants/paths';
import { useAuthUser } from '@hooks';
import {
	getUserWaitingListEntries,
	removeFromWaitingList,
} from '@services/courseWaitingList';
import type { CourseWaitingListEntry } from '@/types/courseWaitingList';
import { fillPath } from '@/utils/paths';
import {
	Box,
	Button,
	CircularProgress,
	ConfirmDialog,
	ContentSwap,
	Link,
	Paper,
	Stagger,
	StaggerItem,
	Typography,
} from '@ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import NextLink from 'next/link';
import { useState } from 'react';

export const ListaOczekujacychView = () => {
	const user = useAuthUser();
	const queryClient = useQueryClient();
	const [toRemove, setToRemove] = useState<CourseWaitingListEntry | null>(null);

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
			setToRemove(null);
			await queryClient.invalidateQueries({ queryKey: ['waitingList', uid] });
		},
	});

	const listState = isLoading ? 'loading' : entries.length === 0 ? 'empty' : 'content';

	return (
		<ContentSwap state={isLoading ? 'loading' : 'content'}>
			{isLoading ? (
				<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
					<CircularProgress />
				</Box>
			) : (
				<Box>
					<Typography variant='h5' component='h1' gutterBottom>
						Lista oczekujących
					</Typography>
					<ContentSwap state={listState}>
						{entries.length === 0 ? (
							<Typography color='text.secondary'>
								Nie jesteś na żadnej liście oczekujących.
							</Typography>
						) : (
							<Stagger sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
								{entries.map((entry) => (
									<StaggerItem key={entry.id}>
										<Paper variant='outlined' sx={{ p: 2 }}>
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
												onClick={() => setToRemove(entry)}
											>
												Usuń
											</Button>
										</Paper>
									</StaggerItem>
								))}
							</Stagger>
						)}
					</ContentSwap>

					<ConfirmDialog
						open={Boolean(toRemove)}
						title='Potwierdź usunięcie z listy'
						cancelLabel='Anuluj'
						confirmLabel='Usuń'
						loading={remove.isPending}
						onCancel={() => setToRemove(null)}
						onConfirm={() => {
							if (toRemove) remove.mutate(toRemove.courseId);
						}}
					>
						{`Czy na pewno chcesz usunąć „${toRemove?.courseName ?? ''}” z listy oczekujących?`}
					</ConfirmDialog>
				</Box>
			)}
		</ContentSwap>
	);
};
