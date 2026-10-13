'use client';

import { deleteBadge, getBadges } from '@services/badges';
import type { Badge } from '@/types/badge';
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
import { BadgeFormDialog } from './forms/BadgeFormDialog';

export const AdminBadgesView = () => <BadgesInner />;

const BadgesInner = () => {
	const queryClient = useQueryClient();
	const { data: badges = [], isLoading } = useQuery({
		queryKey: ['badges'],
		queryFn: getBadges,
	});
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editing, setEditing] = useState<Badge | null>(null);
	const [toDelete, setToDelete] = useState<Badge | null>(null);

	const remove = useMutation({
		mutationFn: deleteBadge,
		onSuccess: async () => {
			setToDelete(null);
			await queryClient.invalidateQueries({ queryKey: ['badges'] });
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
						<Box>
							<Typography variant='h5'>Odznaki</Typography>
							<Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
								Własne osiągnięcia (poza ukończeniem szkoleń). Przypisujesz je użytkownikom w
								Uczestnicy → Ukończenia. Grafiki wrzuć do{' '}
								<code>/public/badges</code> i uruchom <code>pnpm optimize-images</code>.
							</Typography>
						</Box>
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

					<BadgeFormDialog
						open={dialogOpen}
						badge={editing}
						onClose={() => setDialogOpen(false)}
						onSaved={async () => {
							await queryClient.invalidateQueries({ queryKey: ['badges'] });
						}}
					/>

					{badges.length === 0 ? (
						<Typography color='text.secondary'>
							Brak odznak. Dodaj pierwszą, potem przypisz ją użytkownikowi.
						</Typography>
					) : (
						<Stagger sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
							{badges.map((badge) => (
								<StaggerItem key={badge.id}>
									<Paper variant='outlined' sx={{ p: 2 }}>
										<Stack
											direction='row'
											sx={{ alignItems: 'center', gap: 2, justifyContent: 'space-between' }}
										>
											<Stack direction='row' spacing={2} sx={{ alignItems: 'center', minWidth: 0 }}>
												<Box
													component='img'
													src={badge.image}
													alt=''
													sx={{
														width: 48,
														height: 48,
														borderRadius: '50%',
														border: '2px solid',
														borderColor: 'ink.main',
														objectFit: 'cover',
														bgcolor: 'surface.muted',
														flexShrink: 0,
													}}
												/>
												<Box sx={{ minWidth: 0 }}>
													<Typography sx={{ fontWeight: 600 }}>{badge.name}</Typography>
													<Typography variant='body2' color='text.secondary' noWrap>
														/{badge.slug}
														{badge.description ? ` · ${badge.description}` : ''}
													</Typography>
												</Box>
											</Stack>
											<Stack direction='row' spacing={1} sx={{ flexShrink: 0 }}>
												<Button
													size='small'
													variant='outlined'
													onClick={() => {
														setEditing(badge);
														setDialogOpen(true);
													}}
												>
													Edytuj
												</Button>
												<Button
													size='small'
													color='error'
													onClick={() => setToDelete(badge)}
												>
													Usuń
												</Button>
											</Stack>
										</Stack>
									</Paper>
								</StaggerItem>
							))}
						</Stagger>
					)}

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
							Czy na pewno chcesz usunąć odznakę <strong>{toDelete?.name}</strong>? Już
							przypisane odznaki u użytkowników zostaną (z zapisaną nazwą i grafiką).
						</Typography>
					</ConfirmDialog>
				</Box>
			)}
		</ContentSwap>
	);
};
