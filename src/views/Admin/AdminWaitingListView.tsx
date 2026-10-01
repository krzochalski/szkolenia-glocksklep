'use client';

import {
	adminGetWaitingListEntries,
	adminRemoveFromWaitingList,
} from '@services/courseWaitingList';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Box, Button, CircularProgress, ConfirmDialog, Paper, Stack, Typography } from '@ui';
import { useState } from 'react';
import type { CourseWaitingListEntry } from '@/types/courseWaitingList';

export const AdminWaitingListView = () => <WaitingInner />;

const WaitingInner = () => {
	const queryClient = useQueryClient();
	const { data: entries = [], isLoading } = useQuery({
		queryKey: ['adminWaitingList'],
		queryFn: adminGetWaitingListEntries,
	});
	const [toDelete, setToDelete] = useState<CourseWaitingListEntry | null>(null);

	const remove = useMutation({
		mutationFn: adminRemoveFromWaitingList,
		onSuccess: async () => {
			setToDelete(null);
			await queryClient.invalidateQueries({ queryKey: ['adminWaitingList'] });
		},
	});

	if (isLoading) return <CircularProgress />;

	return (
		<Box>
			<Typography variant='h5' gutterBottom>
				Lista oczekujących
			</Typography>
			<Stack spacing={1}>
				{entries.map((entry) => (
					<Paper key={entry.id} variant='outlined' sx={{ p: 2 }}>
						<Typography sx={{ fontWeight: 600 }}>{entry.courseName}</Typography>
						<Typography variant='body2' color='text.secondary'>
							{entry.guest ? 'Gość' : entry.userName} · {entry.email}
							{entry.guest ? ' · bez konta' : ''}
						</Typography>
						<Button
							sx={{ mt: 1 }}
							size='small'
							color='error'
							variant='outlined'
							disabled={remove.isPending}
							onClick={() => setToDelete(entry)}
						>
							Usuń
						</Button>
					</Paper>
				))}
				{entries.length === 0 ? <Typography color='text.secondary'>Lista pusta.</Typography> : null}
			</Stack>

			<ConfirmDialog
				open={Boolean(toDelete)}
				title='Potwierdź usunięcie'
				cancelLabel='Anuluj'
				confirmLabel='Usuń'
				loading={remove.isPending}
				onCancel={() => setToDelete(null)}
				onConfirm={() => {
					if (toDelete) remove.mutate(toDelete.id);
				}}
			>
				<Typography>
					Czy na pewno chcesz usunąć <strong>{toDelete?.userName}</strong> z listy oczekujących na{' '}
					<strong>{toDelete?.courseName}</strong>? Tej operacji nie można cofnąć.
				</Typography>
			</ConfirmDialog>
		</Box>
	);
};
