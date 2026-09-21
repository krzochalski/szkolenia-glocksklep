'use client';

import { deleteBillingData, getAllBillingData } from '@services/billingData';
import { getInstructors } from '@services/instructors';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Box, Button, CircularProgress, ConfirmDialog, Paper, Stack, Typography } from '@ui';
import { useState } from 'react';
import type { BillingData } from '@/types/billingData';
import { AdminGate } from './AdminGate';
import { BillingDataFormDialog } from './forms/BillingDataFormDialog';

export const AdminBillingDataView = () => (
	<AdminGate>
		<BillingInner />
	</AdminGate>
);

const BillingInner = () => {
	const queryClient = useQueryClient();
	const { data: items = [], isLoading } = useQuery({
		queryKey: ['billingData'],
		queryFn: getAllBillingData,
	});
	const { data: instructors = [] } = useQuery({
		queryKey: ['instructors'],
		queryFn: getInstructors,
	});
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editing, setEditing] = useState<BillingData | null>(null);
	const [toDelete, setToDelete] = useState<BillingData | null>(null);

	const remove = useMutation({
		mutationFn: deleteBillingData,
		onSuccess: async () => {
			setToDelete(null);
			await queryClient.invalidateQueries({ queryKey: ['billingData'] });
		},
	});

	if (isLoading) return <CircularProgress />;

	return (
		<Box>
			<Stack direction='row' sx={{ mb: 3, alignItems: 'center', justifyContent: 'space-between' }}>
				<Typography variant='h5'>Dane rozliczeniowe</Typography>
				<Button
					variant='contained'
					onClick={() => {
						setEditing(null);
						setDialogOpen(true);
					}}
				>
					Dodaj
				</Button>
			</Stack>

			<BillingDataFormDialog
				open={dialogOpen}
				billingData={editing}
				instructors={instructors}
				onClose={() => setDialogOpen(false)}
				onSaved={async () => {
					await queryClient.invalidateQueries({ queryKey: ['billingData'] });
				}}
			/>

			<Stack spacing={1}>
				{items.map((item) => {
					const instructor = instructors.find((i) => i.id === item.instructorId);
					return (
						<Paper key={item.id} variant='outlined' sx={{ p: 2 }}>
							<Typography sx={{ fontWeight: 600 }}>{item.name}</Typography>
							<Typography variant='body2' color='text.secondary'>
								{instructor?.name ?? item.instructorId} · NIP {item.nip} · {item.bankAccount}
							</Typography>
							<Stack direction='row' spacing={1} sx={{ mt: 1 }}>
								<Button
									size='small'
									variant='outlined'
									onClick={() => {
										setEditing(item);
										setDialogOpen(true);
									}}
								>
									Edytuj
								</Button>
								<Button size='small' color='error' onClick={() => setToDelete(item)}>
									Usuń
								</Button>
							</Stack>
						</Paper>
					);
				})}
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
					Czy na pewno chcesz usunąć dane rozliczeniowe <strong>{toDelete?.name}</strong>? Tej
					operacji nie można cofnąć.
				</Typography>
			</ConfirmDialog>
		</Box>
	);
};
