'use client';

import { Paths } from '@constants/paths';
import {
	deleteCourseDescription,
	getCourseDescriptions,
} from '@services/courseDescriptions';
import { getCourses } from '@services/courses';
import type { CourseDescription } from '@/types/courseDescription';
import { fillPath } from '@/utils/paths';
import {
	Box,
	Button,
	CircularProgress,
	ConfirmDialog,
	ContentSwap,
	DialogActions,
	DialogContent,
	DialogTitle,
	HardShadowDialog,
	hardShadowDialogActionsSx,
	hardShadowDialogContentSx,
	hardShadowDialogTitleSx,
	MenuItem,
	Paper,
	Stack,
	Stagger,
	StaggerItem,
	TextField,
	Typography,
} from '@ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

export const AdminCourseDescriptionsView = () => <DescInner />;

const DescInner = () => {
	const router = useRouter();
	const queryClient = useQueryClient();
	const { data: items = [], isLoading: descriptionsLoading } = useQuery({
		queryKey: ['courseDescriptions'],
		queryFn: getCourseDescriptions,
	});
	const { data: courses = [], isLoading: coursesLoading } = useQuery({
		queryKey: ['courses'],
		queryFn: getCourses,
	});
	const [createOpen, setCreateOpen] = useState(false);
	const [selectedSlug, setSelectedSlug] = useState('');
	const [toDelete, setToDelete] = useState<CourseDescription | null>(null);

	const isLoading = descriptionsLoading || coursesLoading;

	const descriptionBySlug = useMemo(() => {
		const map = new Map(items.map((item) => [item.slug, item]));
		return map;
	}, [items]);

	const coursesWithoutDescription = useMemo(
		() => courses.filter((course) => !descriptionBySlug.has(course.slug)),
		[courses, descriptionBySlug]
	);

	const remove = useMutation({
		mutationFn: deleteCourseDescription,
		onSuccess: async () => {
			setToDelete(null);
			await queryClient.invalidateQueries({ queryKey: ['courseDescriptions'] });
		},
	});

	const goToCreate = (slug: string) => {
		router.push(fillPath(Paths.adminCourseDescriptionEdit, { slug }));
	};

	const openCreateDialog = () => {
		setSelectedSlug(coursesWithoutDescription[0]?.slug ?? '');
		setCreateOpen(true);
	};

	const confirmCreate = () => {
		if (!selectedSlug) return;
		setCreateOpen(false);
		goToCreate(selectedSlug);
	};

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
						<Typography variant='h5'>Opisy szkoleń</Typography>
						<Button
							variant='contained'
							disabled={coursesWithoutDescription.length === 0}
							onClick={openCreateDialog}
						>
							Dodaj
						</Button>
					</Stack>

					{items.length === 0 && coursesWithoutDescription.length === 0 ? (
						<Typography color='text.secondary'>Brak szkoleń do opisania.</Typography>
					) : null}

					{items.length === 0 && coursesWithoutDescription.length > 0 ? (
						<Typography color='text.secondary' sx={{ mb: 2 }}>
							Brak opisów — utwórz opis dla szkolenia.
						</Typography>
					) : null}

					<Stagger sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
						{items.map((item) => {
							const courseName = courses.find((c) => c.slug === item.slug)?.name;
							const title = item.headline.filter(Boolean).join(' ') || courseName || item.slug;
							return (
								<StaggerItem key={item.id}>
									<Paper variant='outlined' sx={{ p: 2 }}>
										<Typography sx={{ fontWeight: 600 }}>{title}</Typography>
										<Typography variant='body2' color='text.secondary'>
											/{item.slug}
										</Typography>
										<Stack direction='row' spacing={1} sx={{ mt: 1 }}>
											<Button
												size='small'
												variant='outlined'
												component={NextLink}
												href={fillPath(Paths.adminCourseDescriptionEdit, {
													slug: item.slug,
												})}
											>
												Edytuj
											</Button>
											<Button
												size='small'
												color='error'
												onClick={() => setToDelete(item)}
											>
												Usuń
											</Button>
										</Stack>
									</Paper>
								</StaggerItem>
							);
						})}

						{coursesWithoutDescription.map((course) => (
							<StaggerItem key={course.id}>
								<Paper variant='outlined' sx={{ p: 2 }}>
									<Typography sx={{ fontWeight: 600 }}>{course.name}</Typography>
									<Typography variant='body2' color='text.secondary'>
										/{course.slug} · brak opisu
									</Typography>
									<Stack direction='row' spacing={1} sx={{ mt: 1 }}>
										<Button
											size='small'
											variant='outlined'
											onClick={() => goToCreate(course.slug)}
										>
											Utwórz opis
										</Button>
									</Stack>
								</Paper>
							</StaggerItem>
						))}
					</Stagger>

					<HardShadowDialog
						open={createOpen}
						onClose={() => setCreateOpen(false)}
						maxWidth='sm'
						fullWidth
					>
						<DialogTitle sx={hardShadowDialogTitleSx}>Nowy opis szkolenia</DialogTitle>
						<DialogContent sx={[hardShadowDialogContentSx, { gap: 2 }]}>
							{coursesWithoutDescription.length === 0 ? (
								<Typography color='text.secondary'>
									Wszystkie szkolenia mają już opis.
								</Typography>
							) : (
								<TextField
									select
									label='Szkolenie'
									fullWidth
									size='small'
									value={selectedSlug}
									onChange={(e) => setSelectedSlug(e.target.value)}
								>
									{coursesWithoutDescription.map((course) => (
										<MenuItem key={course.id} value={course.slug}>
											{course.name} (/{course.slug})
										</MenuItem>
									))}
								</TextField>
							)}
						</DialogContent>
						<DialogActions sx={hardShadowDialogActionsSx}>
							<Button onClick={() => setCreateOpen(false)}>Anuluj</Button>
							<Button
								variant='contained'
								disabled={!selectedSlug}
								onClick={confirmCreate}
							>
								Utwórz
							</Button>
						</DialogActions>
					</HardShadowDialog>

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
							Czy na pewno chcesz usunąć opis <strong>/{toDelete?.slug}</strong>? Tej
							operacji nie można cofnąć.
						</Typography>
					</ConfirmDialog>
				</Box>
			)}
		</ContentSwap>
	);
};
