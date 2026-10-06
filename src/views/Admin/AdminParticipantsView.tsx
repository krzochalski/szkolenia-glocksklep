'use client';

import { adminDeleteUser, adminGetUsers } from '@services/users';
import type { UserProfile } from '@services/users';
import {
	Box,
	Button,
	CircularProgress,
	ConfirmDialog,
	ContentSwap,
	Paper,
	Stack,
	Stagger,
	StaggerItem,
	Typography,
} from '@ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { AdminEnrollDialog } from './forms/AdminEnrollDialog';

export const AdminParticipantsView = () => <UsersInner />;

const UsersInner = () => {
	const queryClient = useQueryClient();
	const { data: users = [], isLoading } = useQuery({
		queryKey: ['adminUsers'],
		queryFn: adminGetUsers,
	});
	const [enrollOpen, setEnrollOpen] = useState(false);
	const [toDelete, setToDelete] = useState<UserProfile | null>(null);

	const remove = useMutation({
		mutationFn: adminDeleteUser,
		onSuccess: async () => {
			setToDelete(null);
			await queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
		},
	});

	return (
		<ContentSwap state={isLoading ? 'loading' : 'content'}>
			{isLoading ? (
				<CircularProgress />
			) : (
		<Box>
			<Stack
				direction='row'
				sx={{ mb: 3, alignItems: 'center', justifyContent: 'space-between' }}
			>
				<Typography variant='h5'>Użytkownicy</Typography>
				<Button variant='contained' onClick={() => setEnrollOpen(true)}>
					Zapisz uczestnika
				</Button>
			</Stack>

			<AdminEnrollDialog
				open={enrollOpen}
				onClose={() => setEnrollOpen(false)}
				onEnrolled={async () => {
					await queryClient.invalidateQueries({ queryKey: ['courses'] });
				}}
			/>

			<Stagger sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
				{users.map((user) => (
					<StaggerItem key={user.uid}>
					<Paper variant='outlined' sx={{ p: 2 }}>
						<Stack direction='row' sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
							<Box>
								<Typography sx={{ fontWeight: 600 }}>{user.displayName || '—'}</Typography>
								<Typography variant='body2' color='text.secondary'>
									{user.email} {user.phoneNumber ? `· ${user.phoneNumber}` : ''}
								</Typography>
							</Box>
							<Button
								size='small'
								color='error'
								variant='outlined'
								disabled={remove.isPending}
								onClick={() => setToDelete(user)}
							>
								Usuń
							</Button>
						</Stack>
					</Paper>
					</StaggerItem>
				))}
			</Stagger>

			<ConfirmDialog
				open={Boolean(toDelete)}
				title='Potwierdź usunięcie'
				cancelLabel='Anuluj'
				confirmLabel='Usuń'
				loading={remove.isPending}
				onCancel={() => setToDelete(null)}
				onConfirm={() => {
					if (toDelete) remove.mutate(toDelete.uid);
				}}
			>
				<Typography>
					Czy na pewno chcesz usunąć użytkownika{' '}
					<strong>{toDelete?.displayName || toDelete?.email}</strong>? Zostanie usunięte konto
					logowania (Auth) oraz profil w bazie.
				</Typography>
			</ConfirmDialog>
		</Box>
			)}
		</ContentSwap>
	);
};
