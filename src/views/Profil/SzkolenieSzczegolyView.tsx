'use client';

import { Paths } from '@constants/paths';
import { useAuthUser } from '@hooks';
import { getCourseDescriptionBySlug } from '@services/courseDescriptions';
import { getCourseBySlug, unenrollFromCourse } from '@services/courses';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	Box,
	Button,
	CircularProgress,
	ConfirmDialog,
	ContentSwap,
	Divider,
	Link,
	Stack,
	Typography,
} from '@ui';
import { ArrowBack, Block, CheckCircle } from '@ui/icons';
import NextLink from 'next/link';
import { useState } from 'react';
import { CourseFacts } from '@/components/CourseFacts';
import { ListItem } from '@/components/CourseLayout/ListItem';
import { ModuleCard } from '@/components/CourseLayout/ModuleCard';
import { SectionLabel } from '@/components/CourseLayout/SectionLabel';
import { formatCourseDatePl } from '@/utils/formatEnrollment';
import { mapParticipantDescription } from '@/utils/mapParticipantDescription';
import { fillPath } from '@/utils/paths';

type Props = {
	readonly slug: string;
	readonly dateId: string;
};

export const SzkolenieSzczegolyView = ({ slug, dateId }: Props) => {
	const user = useAuthUser();
	const queryClient = useQueryClient();
	const [confirmOpen, setConfirmOpen] = useState(false);

	const { data: course, isLoading } = useQuery({
		queryKey: ['course', slug],
		queryFn: () => getCourseBySlug(slug),
	});

	const { data: description } = useQuery({
		queryKey: ['courseDescription', slug],
		queryFn: () => getCourseDescriptionBySlug(slug),
	});

	const date = course?.dates?.find((d) => d.id === dateId);
	const participant = date?.participants?.find((p) => p.id === user?.uid);
	const panel = description ? mapParticipantDescription(description) : null;
	const hasForWhomSection = Boolean(panel?.forWhom?.length || panel?.notExpect?.length);
	const hasBringSection = Boolean(panel?.bring?.length || panel?.dontBring?.length);

	const unenroll = useMutation({
		mutationFn: async () => {
			if (!course || !user) throw new Error('Brak danych.');
			await unenrollFromCourse(course.id, dateId, user.uid);
		},
		onSuccess: async () => {
			setConfirmOpen(false);
			await queryClient.invalidateQueries({ queryKey: ['courses'] });
			await queryClient.invalidateQueries({ queryKey: ['course', slug] });
		},
	});

	const detailState = isLoading ? 'loading' : !course || !date ? 'notfound' : 'content';

	return (
		<ContentSwap state={detailState}>
			{isLoading ? (
				<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
					<CircularProgress />
				</Box>
			) : !course || !date ? (
				<Typography>Nie znaleziono terminu.</Typography>
			) : (
				<Box>
					<Button
						component={NextLink}
						href={Paths.mojeShkolenia}
						startIcon={<ArrowBack />}
						variant='text'
						sx={{
							fontFamily: '"Space Mono", monospace',
							fontSize: '0.75rem',
							letterSpacing: '0.08em',
							textTransform: 'uppercase',
							px: 0,
							mb: 2,
						}}
					>
						Powrót do moich szkoleń
					</Button>

					<Typography variant='h5' component='h1' gutterBottom>
						{course.name}
					</Typography>
					<Typography color='text.secondary' sx={{ mb: 1 }}>
						{formatCourseDatePl(date.date)} · {date.timeStart} · {date.place?.name}
					</Typography>
					<Typography sx={{ mb: 1 }}>{course.description}</Typography>

					<CourseFacts
						meta={{
							price: date.customPrice ?? course.price,
							hours: course.hours,
							level: course.level,
							tags: course.tags,
							slotsMax: date.slotsMax,
							courseSlug: course.slug,
						}}
					/>

					{panel?.modules?.length ? (
						<Box sx={{ mt: 4, mb: 4 }}>
							<SectionLabel>Program zajęć</SectionLabel>
							<Typography variant='h2' sx={{ fontSize: { xs: '1.25rem', md: '1.75rem' }, mb: 3 }}>
								Zakres merytoryczny
							</Typography>
							<Box
								sx={{
									display: 'grid',
									gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
									gap: '2px',
									bgcolor: 'ink.main',
									border: '2px solid',
									borderColor: 'ink.main',
								}}
							>
								{panel.modules.map((m) => (
									<ModuleCard key={m.title} {...m} />
								))}
							</Box>
						</Box>
					) : null}

					{hasForWhomSection ? (
						<>
							<Divider sx={{ my: 4 }} />
							<Box
								sx={{
									mb: 4,
									display: 'grid',
									gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
									gap: 4,
								}}
							>
								{panel?.forWhom?.length ? (
									<Box>
										<SectionLabel>Zajęcia dla</SectionLabel>
										<Typography
											variant='h2'
											sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' }, mb: 2 }}
										>
											{panel.forWhomHeading || 'Kto powinien przyjść'}
										</Typography>
										<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
											{panel.forWhom.map((item) => (
												<ListItem
													key={item}
													icon={<CheckCircle sx={{ fontSize: 18 }} />}
													text={item}
													color='primary.main'
												/>
											))}
										</Box>
									</Box>
								) : null}
								{panel?.notExpect?.length ? (
									<Box>
										<SectionLabel>Czego nie będzie</SectionLabel>
										<Typography
											variant='h2'
											sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' }, mb: 2 }}
										>
											{panel.notExpectHeading || 'Czego się nie spodziewaj'}
										</Typography>
										<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
											{panel.notExpect.map((item) => (
												<ListItem
													key={item}
													icon={<Block sx={{ fontSize: 18 }} />}
													text={item}
													color='error.main'
												/>
											))}
										</Box>
									</Box>
								) : null}
							</Box>
						</>
					) : null}

					{hasBringSection ? (
						<>
							<Divider sx={{ my: 4 }} />
							<Box
								sx={{
									mb: 4,
									display: 'grid',
									gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
									gap: 4,
								}}
							>
								{panel?.bring?.length ? (
									<Box>
										<SectionLabel>Co zabrać</SectionLabel>
										<Typography
											variant='h2'
											sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' }, mb: 2 }}
										>
											{panel.bringHeading || 'Wyposażenie'}
										</Typography>
										<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
											{panel.bring.map((item) => (
												<ListItem
													key={item}
													icon={<CheckCircle sx={{ fontSize: 16 }} />}
													text={item}
													color='primary.main'
												/>
											))}
										</Box>
									</Box>
								) : null}
								{panel?.dontBring?.length ? (
									<Box>
										<SectionLabel>Czego nie zabierać</SectionLabel>
										<Typography
											variant='h2'
											sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' }, mb: 2 }}
										>
											{panel.dontBringHeading || 'Zostaw w domu'}
										</Typography>
										<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
											{panel.dontBring.map((item) => (
												<ListItem
													key={item}
													icon={<Block sx={{ fontSize: 16 }} />}
													text={item}
													color='error.main'
												/>
											))}
										</Box>
									</Box>
								) : null}
							</Box>
						</>
					) : null}

					<Stack direction='row' spacing={2} sx={{ alignItems: 'center', mt: 2 }}>
						<Typography>
							Status płatności: {participant?.paid ? 'Opłacone' : 'Nieopłacone'}
							{participant?.paysByCash ? ' (gotówka)' : ''}
						</Typography>
						<Link component={NextLink} href={fillPath(Paths.proforma, { slug, dateId })}>
							Proforma
						</Link>
					</Stack>

					{participant ? (
						<>
							<Button
								sx={{ mt: 3 }}
								variant='outlined'
								color='error'
								disabled={unenroll.isPending}
								onClick={() => setConfirmOpen(true)}
							>
								Wypisz się
							</Button>
							<ConfirmDialog
								open={confirmOpen}
								title='Potwierdź wypisanie'
								cancelLabel='Anuluj'
								confirmLabel='Wypisz się'
								loading={unenroll.isPending}
								onCancel={() => setConfirmOpen(false)}
								onConfirm={() => unenroll.mutate()}
							>
								{`Czy na pewno chcesz wypisać się z „${course.name}” (${date.date})?`}
							</ConfirmDialog>
						</>
					) : (
						<Typography sx={{ mt: 2 }} color='text.secondary'>
							Nie jesteś zapisany na ten termin.
						</Typography>
					)}
				</Box>
			)}
		</ContentSwap>
	);
};
