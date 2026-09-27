'use client';

import { CONTACT_REQUEST_FORMAT_LABELS } from '@constants/contactRequest';
import {
	adminDeleteContactRequest,
	adminGetContactRequests,
	adminUpdateContactRequestStatus,
} from '@services/contactRequests';
import type { ContactRequest } from '@/types/contactRequest';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	Box,
	Button,
	CircularProgress,
	ConfirmDialog,
	Paper,
	Stack,
	Typography,
} from '@ui';
import { useState } from 'react';
import { AdminGate } from './AdminGate';

export const AdminContactRequestsView = () => (
	<AdminGate>
		<ContactRequestsInner />
	</AdminGate>
);

const ContactRequestsInner = () => {
	const queryClient = useQueryClient();
	const { data: entries = [], isLoading } = useQuery({
		queryKey: ['adminContactRequests'],
		queryFn: adminGetContactRequests,
	});
	const [toDelete, setToDelete] = useState<ContactRequest | null>(null);

	const invalidate = async () => {
		await queryClient.invalidateQueries({ queryKey: ['adminContactRequests'] });
	};

	const updateStatus = useMutation({
		mutationFn: ({ id, status }: { id: string; status: ContactRequest['status'] }) =>
			adminUpdateContactRequestStatus(id, status),
		onSuccess: invalidate,
	});

	const remove = useMutation({
		mutationFn: adminDeleteContactRequest,
		onSuccess: async () => {
			setToDelete(null);
			await invalidate();
		},
	});

	if (isLoading) return <CircularProgress />;

	return (
		<Box>
			<Typography variant='h5' gutterBottom>
				Zgłoszenia kontaktu
			</Typography>
			<Typography color='text.secondary' sx={{ mb: 2 }}>
				Zgłoszenia z formularza „Zostaw kontakt” na stronie głównej.
			</Typography>
			<Stack spacing={1}>
				{entries.map((entry) => (
					<Paper key={entry.id} variant='outlined' sx={{ p: 2 }}>
						<Stack
							direction={{ xs: 'column', sm: 'row' }}
							spacing={1}
							sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-start' } }}
						>
							<Box sx={{ minWidth: 0, flex: 1 }}>
								<Typography sx={{ fontWeight: 600 }}>
									{CONTACT_REQUEST_FORMAT_LABELS[entry.format]}
									{entry.status === 'handled' ? ' · obsłużone' : ' · nowe'}
								</Typography>
								<Typography variant='body2' color='text.secondary'>
									{entry.email}
									{entry.phone ? ` · ${entry.phone}` : ''}
								</Typography>
								<Typography variant='body2' sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
									{entry.message}
								</Typography>
								<Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 1 }}>
									{new Date(entry.createdAt).toLocaleString('pl-PL')}
								</Typography>
							</Box>
							<Stack direction='row' spacing={1} sx={{ flexShrink: 0 }}>
								{entry.status === 'new' ? (
									<Button
										size='small'
										variant='outlined'
										disabled={updateStatus.isPending}
										onClick={() =>
											updateStatus.mutate({ id: entry.id, status: 'handled' })
										}
									>
										Oznacz jako obsłużone
									</Button>
								) : (
									<Button
										size='small'
										variant='outlined'
										disabled={updateStatus.isPending}
										onClick={() => updateStatus.mutate({ id: entry.id, status: 'new' })}
									>
										Przywróć nowe
									</Button>
								)}
								<Button
									size='small'
									color='error'
									variant='outlined'
									disabled={remove.isPending}
									onClick={() => setToDelete(entry)}
								>
									Usuń
								</Button>
							</Stack>
						</Stack>
					</Paper>
				))}
				{entries.length === 0 ? (
					<Typography color='text.secondary'>Brak zgłoszeń.</Typography>
				) : null}
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
					Czy na pewno chcesz usunąć zgłoszenie od <strong>{toDelete?.email}</strong>? Tej
					operacji nie można cofnąć.
				</Typography>
			</ConfirmDialog>
		</Box>
	);
};
