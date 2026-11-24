'use client';

import { deleteTag, getTags } from '@services/tags';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { useState } from 'react';
import type { Tag } from '@/types/course';
import { AdminPageHeader } from '@components';
import { TagFormDialog } from './forms/TagFormDialog';

export const AdminTagsView = () => <TagsInner />;

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

	return (
		<ContentSwap state={isLoading ? 'loading' : 'content'}>
			{isLoading ? (
				<CircularProgress />
			) : (
		<Box sx={{ minWidth: 0, maxWidth: '100%' }}>
			<AdminPageHeader
				title='Tagi'
				actions={
					<Button
						variant='contained'
						fullWidth
						onClick={() => {
							setEditing(null);
							setDialogOpen(true);
						}}
					>
						Dodaj
					</Button>
				}
			/>

			<TagFormDialog
				open={dialogOpen}
				tag={editing}
				onClose={() => setDialogOpen(false)}
				onSaved={async () => {
					await queryClient.invalidateQueries({ queryKey: ['tags'] });
				}}
			/>

			<Stagger sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
				{tags.map((tag) => (
					<StaggerItem key={tag.id}>
					<Paper variant='outlined' sx={{ p: 2 }}>
						<Typography sx={{ fontWeight: 600 }}>{tag.name}</Typography>
						<Typography variant='body2' color='text.secondary'>
							/{tag.slug}
						</Typography>
						<Stack
							direction={{ xs: 'column', sm: 'row' }}
							spacing={1}
							sx={{ mt: 1, '& .MuiButton-root': { minHeight: 44 } }}
						>
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
					if (toDelete) remove.mutate(toDelete.id);
				}}
			>
				<Typography>
					Czy na pewno chcesz usunąć tag <strong>{toDelete?.name}</strong>? Tej operacji nie można
					cofnąć.
				</Typography>
			</ConfirmDialog>
		</Box>
			)}
		</ContentSwap>
	);
};
