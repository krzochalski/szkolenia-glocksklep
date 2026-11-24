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
import { COURSE_KIND_LABEL, getCourseKind } from '@/utils/courseKind';
import {
	compareCoursesByLegacyCatalogOrder,
	coursesNeedOrderBackfill,
} from '@/utils/courseOrder';
import { AdminPageHeader } from '@components';
import { adminIconButtonTouchSx } from '@components/adminResponsive';
import { PlaceNameLink } from '@/components/PlaceNameLink';
import { invalidateCourseQueries } from '@/utils/invalidateCourseQueries';
import { fillPath } from '@/utils/paths';
import { bruttoFromNetto } from '@/utils/pricing';
import {
	Box,
	Button,
	Chip,
	CircularProgress,
	ConfirmDialog,
	ContentSwap,
	IconButton,
	Paper,
	Price,
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

const CourseRowActions = ({
	course,
	onDelete,
}: {
	readonly course: Course;
	readonly onDelete: (course: Course) => void;
}) => (
	<Stack direction='row' spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
		<Tooltip title='Terminy'>
			<IconButton
				size='small'
				component={NextLink}
				href={fillPath(Paths.adminCourseAllDates, { courseId: course.id })}
				aria-label='Terminy'
				sx={adminIconButtonTouchSx}
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
				sx={adminIconButtonTouchSx}
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
				sx={adminIconButtonTouchSx}
			>
				<Delete fontSize='small' />
			</IconButton>
		</Tooltip>
	</Stack>
);

const SortableCourseCard = ({ course, onDelete }: SortableCourseRowProps) => {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: course.id,
	});
	const upcoming = getUpcomingDates(course);
	const next = upcoming[0];
	const totalDates = course.dates?.length ?? 0;
	const levelLabel = COURSE_LEVEL_LABEL[course.level] ?? course.level;
	const kind = getCourseKind(course);
	const inactive = isCourseInactive(course);

	return (
		<Paper
			ref={setNodeRef}
			variant='outlined'
			sx={{
				p: 2,
				transform: CSS.Transform.toString(transform),
				transition,
				opacity: isDragging ? 0.6 : 1,
				...(inactive ? { bgcolor: 'action.hover', opacity: 0.85 } : {}),
			}}
		>
			<Stack spacing={1.5}>
				<Stack direction='row' spacing={1} sx={{ alignItems: 'flex-start' }}>
					<IconButton
						size='small'
						{...attributes}
						{...listeners}
						aria-label={`Przenieś ${course.name}`}
						sx={{ cursor: 'grab', touchAction: 'none', ...adminIconButtonTouchSx }}
					>
						<DragHandle fontSize='small' />
					</IconButton>
					<Box sx={{ flex: 1, minWidth: 0 }}>
						<Stack direction='row' spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
							<Typography sx={{ fontWeight: 600 }}>{course.name}</Typography>
							<Chip
								label={COURSE_KIND_LABEL[kind]}
								size='small'
								variant='outlined'
								color={kind === 'practice' ? 'primary' : 'default'}
							/>
							{inactive ? (
								<Chip label='NIEAKTYWNE' size='small' variant='outlined' data-inactive-badge />
							) : null}
						</Stack>
						<Typography variant='body2' color='text.secondary' sx={{ fontFamily: 'monospace', mt: 0.5 }}>
							/{course.slug}
						</Typography>
					</Box>
				</Stack>
				<Stack spacing={0.5}>
					<Typography variant='body2'>
						Poziom: {levelLabel} · {course.hours} h ·{' '}
						<Price
							gross={bruttoFromNetto(course.price)}
							net={course.price}
							size='sm'
							sx={{ display: 'inline-flex', verticalAlign: 'middle' }}
						/>
					</Typography>
					{course.tags?.length ? (
						<Stack direction='row' spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
							{course.tags.map((tag) => (
								<Chip key={tag} label={tag} size='small' variant='outlined' />
							))}
						</Stack>
					) : null}
					<Typography variant='body2'>
						{upcoming.length} nadchodzących / {totalDates} łącznie
						{next ? (
							<>
								{' '}
								· Następny: {next.date} {next.timeStart}
								{next.place ? (
									<>
										{' '}
										· <PlaceNameLink place={next.place} />
									</>
								) : null}
							</>
						) : null}
					</Typography>
				</Stack>
				<CourseRowActions course={course} onDelete={onDelete} />
			</Stack>
		</Paper>
	);
};

const SortableCourseRow = ({ course, onDelete }: SortableCourseRowProps) => {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: course.id,
	});
	const upcoming = getUpcomingDates(course);
	const next = upcoming[0];
	const totalDates = course.dates?.length ?? 0;
	const levelLabel = COURSE_LEVEL_LABEL[course.level] ?? course.level;
	const kind = getCourseKind(course);
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
				<Stack direction='row' spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
					<Typography variant='body2' sx={{ fontWeight: 600 }}>
						{course.name}
					</Typography>
					<Chip
						label={COURSE_KIND_LABEL[kind]}
						size='small'
						variant='outlined'
						color={kind === 'practice' ? 'primary' : 'default'}
					/>
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
				<Price
					gross={bruttoFromNetto(course.price)}
					net={course.price}
					size='sm'
					sx={{ alignItems: 'flex-end', display: 'inline-flex' }}
				/>
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
						{next.place ? (
							<>
								{' '}
								· <PlaceNameLink place={next.place} />
							</>
						) : null}
					</Typography>
				) : (
					<Typography variant='caption' color='text.secondary'>
						Brak nadchodzących
					</Typography>
				)}
			</TableCell>
			<TableCell align='right'>
				<CourseRowActions course={course} onDelete={onDelete} />
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
			.then(() => invalidateCourseQueries(queryClient))
			.catch(() => {
				backfillStarted.current = false;
			});
	}, [courses, isLoading, queryClient]);

	const remove = useMutation({
		mutationFn: deleteCourse,
		onSuccess: async () => {
			setToDelete(null);
			await invalidateCourseQueries(queryClient);
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

	return (
		<ContentSwap state={isLoading ? 'loading' : 'content'}>
			{isLoading ? (
				<CircularProgress />
			) : (
		<Box sx={{ minWidth: 0, maxWidth: '100%' }}>
			<AdminPageHeader
				title='Szkolenia'
				actions={
					<Button component={NextLink} href={Paths.adminCourseNew} variant='contained' fullWidth>
						Nowe szkolenie
					</Button>
				}
			/>

			{courses.length === 0 ? (
				<Typography color='text.secondary'>Brak szkoleń.</Typography>
			) : (
				<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
					<SortableContext
						items={courses.map((c) => c.id)}
						strategy={verticalListSortingStrategy}
					>
						<Stack
							spacing={1.5}
							sx={{ display: { xs: 'flex', md: 'none' } }}
							aria-label='Lista szkoleń'
						>
							{courses.map((course) => (
								<SortableCourseCard
									key={course.id}
									course={course}
									onDelete={setToDelete}
								/>
							))}
						</Stack>
					<TableContainer
						sx={{
							display: { xs: 'none', md: 'block' },
							overflowX: 'auto',
							maxWidth: '100%',
						}}
					>
						<Table size='small' stickyHeader sx={{ minWidth: 720 }}>
							<TableHead>
								<TableRow>
									<TableCell sx={{ width: 48 }} aria-label='Kolejność' />
									<TableCell>Nazwa</TableCell>
									<TableCell>Slug</TableCell>
									<TableCell>Poziom</TableCell>
									<TableCell align='right'>Cena</TableCell>
									<TableCell align='right'>Czas</TableCell>
									<TableCell>Tagi</TableCell>
									<TableCell>Terminy</TableCell>
									<TableCell align='right'>Akcje</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{courses.map((course) => (
									<SortableCourseRow
										key={course.id}
										course={course}
										onDelete={setToDelete}
									/>
								))}
							</TableBody>
						</Table>
					</TableContainer>
					</SortableContext>
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
			)}
		</ContentSwap>
	);
};
