'use client';

import { deleteTag, getTags } from '@services/tags';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Box, Button, CircularProgress, ConfirmDialog, Paper, Stack, Typography } from '@ui';
import { useState } from 'react';
import type { Tag } from '@/types/course';
import { AdminGate } from './AdminGate';
import { TagFormDialog } from './forms/TagFormDialog';

export const AdminTagsView = () => (
	<AdminGate>
		<TagsInner />
	</AdminGate>
);

const TagsInner = () => {
	const queryClient = useQueryClient();
	const { data: tags = [], isLoading } = useQuery({
		queryKey: ['tags'],
		queryFn: getTags,
	});
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editing, setEditing] = useState<Tag | null>(null);
	const [toDelete, setToDelete] = useState<Tag | null>(null);

	const remove = useMutation({
		mutationFn: deleteTag,
		onSuccess: async () => {
			setToDelete(null);
			await queryClient.invalidateQueries({ queryKey: ['tags'] });
		},
	});

	if (isLoading) return <CircularProgress />;

	return (
		<Box>
			<Stack direction='row' sx={{ mb: 3, alignItems: 'center', justifyContent: 'space-between' }}>
				<Typography variant='h5'>Tagi</Typography>
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

			<TagFormDialog
				open={dialogOpen}
				tag={editing}
				onClose={() => setDialogOpen(false)}
				onSaved={async () => {
					await queryClient.invalidateQueries({ queryKey: ['tags'] });
				}}
			/>

			<Stack spacing={1}>
				{tags.map((tag) => (
					<Paper key={tag.id} variant='outlined' sx={{ p: 2 }}>
						<Typography sx={{ fontWeight: 600 }}>{tag.name}</Typography>
						<Typography variant='body2' color='text.secondary'>
							/{tag.slug}
						</Typography>
						<Stack direction='row' spacing={1} sx={{ mt: 1 }}>
							<Button
								size='small'
								variant='outlined'
								onClick={() => {
									setEditing(tag);
									setDialogOpen(true);
								}}
							>
								Edytuj
							</Button>
							<Button size='small' color='error' onClick={() => setToDelete(tag)}>
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
					Czy na pewno chcesz usunąć tag <strong>{toDelete?.name}</strong>? Tej operacji nie można
					cofnąć.
				</Typography>
			</ConfirmDialog>
		</Box>
	);
};
