'use client';

import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core';
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { COURSE_LEVEL_LABEL } from '@constants/courses';
import { Paths } from '@constants/paths';
import { deleteCourse, getCourses, reorderCourses } from '@services/courses';
import type { Course } from '@/types/course';
import { isFutureDate, isCourseClassCanceled, isCourseInactive } from '@/utils/courseDates';
import {
	compareCoursesByLegacyCatalogOrder,
	coursesNeedOrderBackfill,
} from '@/utils/courseOrder';
import { fillPath } from '@/utils/paths';
import { formatCoursePrice } from '@/utils/pricing';
import {
	Box,
	Button,
	Chip,
	CircularProgress,
	ConfirmDialog,
	IconButton,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Tooltip,
	Typography,
} from '@ui';
import { CalendarMonth, Delete, DragHandle, Edit } from '@ui/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import NextLink from 'next/link';
import { useEffect, useRef, useState } from 'react';

export const AdminCoursesView = () => <AdminCoursesInner />;

const getUpcomingDates = (course: Course) =>
	(course.dates ?? [])
		.filter((d) => isFutureDate(d.date) && !isCourseClassCanceled(d))
		.sort((a, b) => a.date.localeCompare(b.date));

type SortableCourseRowProps = {
	readonly course: Course;
	readonly onDelete: (course: Course) => void;
};

const SortableCourseRow = ({ course, onDelete }: SortableCourseRowProps) => {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: course.id,
	});
	const upcoming = getUpcomingDates(course);
	const next = upcoming[0];
	const totalDates = course.dates?.length ?? 0;
	const levelLabel = COURSE_LEVEL_LABEL[course.level] ?? course.level;
	const inactive = isCourseInactive(course);

	return (
		<TableRow
			ref={setNodeRef}
			hover
			sx={{
				transform: CSS.Transform.toString(transform),
				transition,
				opacity: isDragging ? 0.6 : 1,
				...(inactive
					? {
							bgcolor: 'action.hover',
							'& .MuiTableCell-root': { color: 'text.disabled' },
							'& .MuiTypography-root': { color: 'text.disabled' },
							'& .MuiChip-root:not([data-inactive-badge])': {
								opacity: 0.6,
							},
						}
					: {}),
			}}
		>
			<TableCell sx={{ width: 48, px: 0.5 }}>
				<Tooltip title='Przeciągnij, aby zmienić kolejność'>
					<IconButton
						size='small'
						{...attributes}
						{...listeners}
						aria-label={`Przenieś ${course.name}`}
						sx={{ cursor: 'grab', touchAction: 'none' }}
					>
						<DragHandle fontSize='small' />
					</IconButton>
				</Tooltip>
			</TableCell>
			<TableCell>
				<Stack direction='row' spacing={1} sx={{ alignItems: 'center' }}>
					<Typography variant='body2' sx={{ fontWeight: 600 }}>
						{course.name}
					</Typography>
					{inactive ? (
						<Chip
							label='NIEAKTYWNE'
							size='small'
							color='default'
							variant='outlined'
							data-inactive-badge
							sx={{ color: 'text.secondary', borderColor: 'text.disabled' }}
						/>
					) : null}
				</Stack>
			</TableCell>
			<TableCell>
				<Typography variant='body2' color='text.secondary' sx={{ fontFamily: 'monospace' }}>
					/{course.slug}
				</Typography>
			</TableCell>
			<TableCell>
				<Typography variant='body2'>{levelLabel}</Typography>
			</TableCell>
			<TableCell align='right'>
				<Typography variant='body2'>{formatCoursePrice(course.price, 'netto')}</Typography>
			</TableCell>
			<TableCell align='right'>
				<Typography variant='body2'>{course.hours} h</Typography>
			</TableCell>
			<TableCell>
				{course.tags?.length ? (
					<Stack direction='row' spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
						{course.tags.map((tag) => (
							<Chip key={tag} label={tag} size='small' variant='outlined' />
						))}
					</Stack>
				) : (
					<Typography variant='body2' color='text.secondary'>
						—
					</Typography>
				)}
			</TableCell>
			<TableCell>
				<Typography variant='body2'>
					{upcoming.length} nadchodzących / {totalDates} łącznie
				</Typography>
				{next ? (
					<Typography variant='caption' color='text.secondary'>
						Następny: {next.date} {next.timeStart}
						{next.place?.name ? ` · ${next.place.name}` : ''}
					</Typography>
				) : (
					<Typography variant='caption' color='text.secondary'>
						Brak nadchodzących
					</Typography>
				)}
			</TableCell>
			<TableCell align='right'>
				<Stack direction='row' spacing={0.25} sx={{ justifyContent: 'flex-end' }}>
					<Tooltip title='Terminy'>
						<IconButton
							size='small'
							component={NextLink}
							href={fillPath(Paths.adminCourseAllDates, {
								courseId: course.id,
							})}
							aria-label='Terminy'
						>
							<CalendarMonth fontSize='small' />
						</IconButton>
					</Tooltip>
					<Tooltip title='Edytuj'>
						<IconButton
							size='small'
							component={NextLink}
							href={fillPath(Paths.adminCourseEdit, { courseId: course.id })}
							aria-label='Edytuj szkolenie'
						>
							<Edit fontSize='small' />
						</IconButton>
					</Tooltip>
					<Tooltip title='Usuń'>
						<IconButton
							size='small'
							color='error'
							onClick={() => onDelete(course)}
							aria-label='Usuń szkolenie'
						>
							<Delete fontSize='small' />
						</IconButton>
					</Tooltip>
				</Stack>
			</TableCell>
		</TableRow>
	);
};

const AdminCoursesInner = () => {
	const queryClient = useQueryClient();
	const { data: courses = [], isLoading } = useQuery({
		queryKey: ['courses'],
		queryFn: getCourses,
	});
	const [toDelete, setToDelete] = useState<Course | null>(null);
	const backfillStarted = useRef(false);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

	useEffect(() => {
		if (isLoading || backfillStarted.current || courses.length === 0) return;
		if (!coursesNeedOrderBackfill(courses)) return;
		backfillStarted.current = true;
		const orderedIds = [...courses]
			.sort(compareCoursesByLegacyCatalogOrder)
			.map((c) => c.id);
		void reorderCourses(orderedIds)
			.then(() => queryClient.invalidateQueries({ queryKey: ['courses'] }))
			.catch(() => {
				backfillStarted.current = false;
			});
	}, [courses, isLoading, queryClient]);

	const remove = useMutation({
		mutationFn: deleteCourse,
		onSuccess: async () => {
			setToDelete(null);
			await queryClient.invalidateQueries({ queryKey: ['courses'] });
		},
	});

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (!over || active.id === over.id) return;
		const oldIndex = courses.findIndex((c) => c.id === active.id);
		const newIndex = courses.findIndex((c) => c.id === over.id);
		if (oldIndex < 0 || newIndex < 0) return;
		const previous = courses;
		const next = arrayMove(courses, oldIndex, newIndex).map((course, index) => ({
			...course,
			order: index,
		}));
		queryClient.setQueryData(['courses'], next);
		void reorderCourses(next.map((c) => c.id)).catch(() => {
			queryClient.setQueryData(['courses'], previous);
		});
	};

	if (isLoading) return <CircularProgress />;

	return (
		<Box>
			<Stack
				direction='row'
				sx={{ mb: 3, alignItems: 'center', justifyContent: 'space-between' }}
			>
				<Typography variant='h5'>Szkolenia</Typography>
				<Button component={NextLink} href={Paths.adminCourseNew} variant='contained'>
					Nowe szkolenie
				</Button>
			</Stack>

			{courses.length === 0 ? (
				<Typography color='text.secondary'>Brak szkoleń.</Typography>
			) : (
				<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
					<TableContainer sx={{ overflowX: 'auto' }}>
						<Table size='small' stickyHeader>
							<TableHead>
								<TableRow>
									<TableCell sx={{ width: 48 }} aria-label='Kolejność' />
									<TableCell>Nazwa</TableCell>
									<TableCell>Slug</TableCell>
									<TableCell>Poziom</TableCell>
									<TableCell align='right'>Cena netto</TableCell>
									<TableCell align='right'>Czas</TableCell>
									<TableCell>Tagi</TableCell>
									<TableCell>Terminy</TableCell>
									<TableCell align='right'>Akcje</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								<SortableContext
									items={courses.map((c) => c.id)}
									strategy={verticalListSortingStrategy}
								>
									{courses.map((course) => (
										<SortableCourseRow
											key={course.id}
											course={course}
											onDelete={setToDelete}
										/>
									))}
								</SortableContext>
							</TableBody>
						</Table>
					</TableContainer>
				</DndContext>
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
					Czy na pewno chcesz usunąć szkolenie <strong>{toDelete?.name}</strong>? Tej operacji nie
					można cofnąć.
				</Typography>
			</ConfirmDialog>
		</Box>
	);
};
