'use client';

import { Paths } from '@constants/paths';
import {
	adminGetCourseDebriefings,
	deleteCourseDebriefing,
} from '@services/courseDebriefings';
import { getCourses } from '@services/courses';
import type { CourseDebriefing } from '@/types/courseDebriefing';
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

export const AdminDebriefingsView = () => <DebriefingsInner />;

const DebriefingsInner = () => {
	const router = useRouter();
	const queryClient = useQueryClient();
	const { data: items = [], isLoading: debriefingsLoading } = useQuery({
		queryKey: ['courseDebriefings'],
		queryFn: adminGetCourseDebriefings,
	});
	const { data: courses = [], isLoading: coursesLoading } = useQuery({
		queryKey: ['courses'],
		queryFn: getCourses,
	});
	const [createOpen, setCreateOpen] = useState(false);
	const [selectedCourseId, setSelectedCourseId] = useState('');
	const [toDelete, setToDelete] = useState<CourseDebriefing | null>(null);

	const isLoading = debriefingsLoading || coursesLoading;

	const debriefingByCourseId = useMemo(() => {
		const map = new Map(items.map((item) => [item.courseId, item]));
		return map;
	}, [items]);

	const coursesWithoutDebriefing = useMemo(
		() => courses.filter((course) => !debriefingByCourseId.has(course.id)),
		[courses, debriefingByCourseId]
	);

	const remove = useMutation({
		mutationFn: deleteCourseDebriefing,
		onSuccess: async () => {
			setToDelete(null);
			await queryClient.invalidateQueries({ queryKey: ['courseDebriefings'] });
		},
	});

	const goToEdit = (courseId: string) => {
		router.push(fillPath(Paths.adminDebriefingEdit, { courseId }));
	};

	const openCreateDialog = () => {
		setSelectedCourseId(coursesWithoutDebriefing[0]?.id ?? '');
		setCreateOpen(true);
	};

	const confirmCreate = () => {
		if (!selectedCourseId) return;
		setCreateOpen(false);
		goToEdit(selectedCourseId);
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
						<Box>
							<Typography variant='h5'>Debriefing po szkoleniu</Typography>
							<Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
								Plan zajęć i ćwiczenia dodatkowe — widoczne tylko dla osób oznaczonych
								jako absolwenci danego szkolenia.
							</Typography>
						</Box>
						<Button
							variant='contained'
							disabled={coursesWithoutDebriefing.length === 0}
							onClick={openCreateDialog}
						>
							Dodaj
						</Button>
					</Stack>

					{items.length === 0 && coursesWithoutDebriefing.length === 0 ? (
						<Typography color='text.secondary'>Brak szkoleń.</Typography>
					) : null}

					{items.length === 0 && coursesWithoutDebriefing.length > 0 ? (
						<Typography color='text.secondary' sx={{ mb: 2 }}>
							Brak debriefingów — utwórz treść dla szkolenia.
						</Typography>
					) : null}

					<Stagger sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
						{items.map((item) => (
							<StaggerItem key={item.courseId}>
								<Paper variant='outlined' sx={{ p: 2 }}>
									<Typography sx={{ fontWeight: 600 }}>{item.courseName}</Typography>
									<Typography variant='body2' color='text.secondary'>
										/{item.courseSlug}
										{item.updatedAt
											? ` · ${new Date(item.updatedAt).toLocaleString('pl-PL')}`
											: ''}
									</Typography>
									<Stack direction='row' spacing={1} sx={{ mt: 1 }}>
										<Button
											size='small'
											variant='outlined'
											component={NextLink}
											href={fillPath(Paths.adminDebriefingEdit, {
												courseId: item.courseId,
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
						))}

						{coursesWithoutDebriefing.map((course) => (
							<StaggerItem key={course.id}>
								<Paper variant='outlined' sx={{ p: 2 }}>
									<Typography sx={{ fontWeight: 600 }}>{course.name}</Typography>
									<Typography variant='body2' color='text.secondary'>
										/{course.slug} · brak debriefingu
									</Typography>
									<Stack direction='row' spacing={1} sx={{ mt: 1 }}>
										<Button
											size='small'
											variant='outlined'
											onClick={() => goToEdit(course.id)}
										>
											Utwórz
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
						<DialogTitle sx={hardShadowDialogTitleSx}>Nowy debriefing</DialogTitle>
						<DialogContent sx={[hardShadowDialogContentSx, { gap: 2 }]}>
							{coursesWithoutDebriefing.length === 0 ? (
								<Typography color='text.secondary'>
									Wszystkie szkolenia mają już debriefing.
								</Typography>
							) : (
								<TextField
									select
									label='Szkolenie'
									fullWidth
									size='small'
									value={selectedCourseId}
									onChange={(e) => setSelectedCourseId(e.target.value)}
								>
									{coursesWithoutDebriefing.map((course) => (
										<MenuItem key={course.id} value={course.id}>
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
								disabled={!selectedCourseId}
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
							if (toDelete) remove.mutate(toDelete.courseId);
						}}
					>
						<Typography>
							Czy na pewno chcesz usunąć debriefing dla{' '}
							<strong>{toDelete?.courseName}</strong>? Tej operacji nie można
							cofnąć.
						</Typography>
					</ConfirmDialog>
				</Box>
			)}
		</ContentSwap>
	);
};
