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
import { AdminPageHeader } from '@components';
import { invalidateCourseQueries } from '@/utils/invalidateCourseQueries';
import { AdminCourseCompletionsDialog } from './forms/AdminCourseCompletionsDialog';
import { AdminEnrollDialog } from './forms/AdminEnrollDialog';

export const AdminParticipantsView = () => <UsersInner />;

const UsersInner = () => {
	const queryClient = useQueryClient();
	const { data: users = [], isLoading } = useQuery({
		queryKey: ['adminUsers'],
		queryFn: adminGetUsers,
	});
	const [enrollOpen, setEnrollOpen] = useState(false);
	const [completionsUser, setCompletionsUser] = useState<UserProfile | null>(null);
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
		<Box sx={{ minWidth: 0, maxWidth: '100%' }}>
			<AdminPageHeader
				title='Użytkownicy'
				actions={
					<Button variant='contained' onClick={() => setEnrollOpen(true)} fullWidth>
						Zapisz uczestnika
					</Button>
				}
			/>

			<AdminEnrollDialog
				open={enrollOpen}
				onClose={() => setEnrollOpen(false)}
				onEnrolled={async () => {
					await invalidateCourseQueries(queryClient);
				}}
			/>

			<AdminCourseCompletionsDialog
				open={Boolean(completionsUser)}
				user={completionsUser}
				onClose={() => setCompletionsUser(null)}
			/>

			<Stagger sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
				{users.map((user) => (
					<StaggerItem key={user.uid}>
					<Paper variant='outlined' sx={{ p: 2 }}>
						<Stack
							direction={{ xs: 'column', sm: 'row' }}
							sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 1 }}
						>
							<Box sx={{ minWidth: 0 }}>
								<Typography sx={{ fontWeight: 600 }}>{user.displayName || '—'}</Typography>
								<Typography variant='body2' color='text.secondary'>
									{user.email} {user.phoneNumber ? `· ${user.phoneNumber}` : ''}
								</Typography>
							</Box>
							<Stack
								direction={{ xs: 'column', sm: 'row' }}
								spacing={1}
								sx={{ flexShrink: 0, '& .MuiButton-root': { minHeight: 44 } }}
							>
								<Button
									size='small'
									variant='outlined'
									onClick={() => setCompletionsUser(user)}
								>
									Ukończenia
								</Button>
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
