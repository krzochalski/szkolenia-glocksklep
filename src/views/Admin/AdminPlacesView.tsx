'use client';

import { deletePlace, getPlaces } from '@services/places';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Box, Button, CircularProgress, ConfirmDialog, Paper, Stack, Typography } from '@ui';
import { useState } from 'react';
import type { Place } from '@/types/course';
import { AdminGate } from './AdminGate';
import { PlaceFormDialog } from './forms/PlaceFormDialog';

export const AdminPlacesView = () => (
	<AdminGate>
		<PlacesInner />
	</AdminGate>
);

const PlacesInner = () => {
	const queryClient = useQueryClient();
	const { data: places = [], isLoading } = useQuery({
		queryKey: ['places'],
		queryFn: getPlaces,
	});
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editing, setEditing] = useState<Place | null>(null);
	const [toDelete, setToDelete] = useState<Place | null>(null);

	const remove = useMutation({
		mutationFn: deletePlace,
		onSuccess: async () => {
			setToDelete(null);
			await queryClient.invalidateQueries({ queryKey: ['places'] });
		},
	});

	if (isLoading) return <CircularProgress />;

	return (
		<Box>
			<Stack direction='row' sx={{ mb: 3, alignItems: 'center', justifyContent: 'space-between' }}>
				<Typography variant='h5'>Obiekty</Typography>
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

			<PlaceFormDialog
				open={dialogOpen}
				place={editing}
				onClose={() => setDialogOpen(false)}
				onSaved={async () => {
					await queryClient.invalidateQueries({ queryKey: ['places'] });
				}}
			/>

			<Stack spacing={1}>
				{places.map((place) => (
					<Paper key={place.id} variant='outlined' sx={{ p: 2 }}>
						<Typography sx={{ fontWeight: 600 }}>{place.name}</Typography>
						<Typography variant='body2' color='text.secondary'>
							/{place.slug}
						</Typography>
						<Stack direction='row' spacing={1} sx={{ mt: 1 }}>
							<Button
								size='small'
								variant='outlined'
								onClick={() => {
									setEditing(place);
									setDialogOpen(true);
								}}
							>
								Edytuj
							</Button>
							<Button size='small' color='error' onClick={() => setToDelete(place)}>
								Usuń
							</Button>
						</Stack>
					</Paper>
				))}
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
					Czy na pewno chcesz usunąć obiekt <strong>{toDelete?.name}</strong>? Tej operacji nie
					można cofnąć.
				</Typography>
			</ConfirmDialog>
		</Box>
	);
};
