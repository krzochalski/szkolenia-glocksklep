'use client';

import {
	adminAwardBadge,
	adminGetUserAwardedBadges,
	adminRemoveAwardedBadge,
	getBadges,
} from '@services/badges';
import {
	adminGetUserCourseCompletions,
	adminRemoveCourseCompletion,
	adminSetCourseCompletion,
} from '@services/courseCompletions';
import { getCourses } from '@services/courses';
import type { UserProfile } from '@services/users';
import type { Badge } from '@/types/badge';
import type { Course } from '@/types/course';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	Autocomplete,
	Box,
	Button,
	CircularProgress,
	ContentSwap,
	DialogActions,
	DialogContent,
	DialogTitle,
	HardShadowDialog,
	hardShadowDialogActionsSx,
	hardShadowDialogContentSx,
	hardShadowDialogTitleSx,
	MotionAlert,
	Stack,
	TextField,
	Typography,
} from '@ui';
import { MilitaryTechIcon } from '@ui/icons';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';

type Props = {
	readonly open: boolean;
	readonly user: UserProfile | null;
	readonly onClose: () => void;
};

const formatDate = (value: string) => {
	if (!value) return '—';
	const parsed = dayjs(value);
	return parsed.isValid() ? parsed.format('DD.MM.YYYY') : value.slice(0, 10);
};

export const AdminCourseCompletionsDialog = ({ open, user, onClose }: Props) => {
	const queryClient = useQueryClient();
	const uid = user?.uid ?? '';
	const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
	const [completedAt, setCompletedAt] = useState('');
	const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
	const [awardedAt, setAwardedAt] = useState('');
	const [error, setError] = useState<string | null>(null);

	const { data: courses = [], isLoading: coursesLoading } = useQuery({
		queryKey: ['courses'],
		queryFn: getCourses,
		enabled: open,
	});

	const { data: badges = [], isLoading: badgesLoading } = useQuery({
		queryKey: ['badges'],
		queryFn: getBadges,
		enabled: open,
	});

	const { data: completions = [], isLoading: completionsLoading } = useQuery({
		queryKey: ['adminUserCompletions', uid],
		queryFn: () => adminGetUserCourseCompletions(uid),
		enabled: open && Boolean(uid),
	});

	const { data: awards = [], isLoading: awardsLoading } = useQuery({
		queryKey: ['adminUserAwardedBadges', uid],
		queryFn: () => adminGetUserAwardedBadges(uid),
		enabled: open && Boolean(uid),
	});

	const completedIds = useMemo(() => new Set(completions.map((c) => c.courseId)), [completions]);
	const awardedIds = useMemo(() => new Set(awards.map((a) => a.badgeId)), [awards]);

	const availableCourses = useMemo(
		() =>
			courses.filter((c) => !completedIds.has(c.id)).sort((a, b) => a.name.localeCompare(b.name)),
		[courses, completedIds]
	);

	const availableBadges = useMemo(
		() =>
			badges.filter((b) => !awardedIds.has(b.id)).sort((a, b) => a.name.localeCompare(b.name)),
		[badges, awardedIds]
	);

	const invalidate = async () => {
		await queryClient.invalidateQueries({ queryKey: ['adminUserCompletions', uid] });
		await queryClient.invalidateQueries({ queryKey: ['adminUserAwardedBadges', uid] });
		await queryClient.invalidateQueries({ queryKey: ['myCourseCompletions'] });
		await queryClient.invalidateQueries({ queryKey: ['myAwardedBadges'] });
	};

	const addCourseMutation = useMutation({
		mutationFn: async () => {
			if (!user || !selectedCourse) throw new Error('Wybierz szkolenie.');
			await adminSetCourseCompletion({
				uid: user.uid,
				course: selectedCourse,
				completedAt: completedAt || undefined,
			});
		},
		onSuccess: async () => {
			setSelectedCourse(null);
			setCompletedAt('');
			setError(null);
			await invalidate();
		},
		onError: (e) => {
			setError(e instanceof Error ? e.message : 'Nie udało się dodać ukończenia.');
		},
	});

	const removeCourseMutation = useMutation({
		mutationFn: async (courseId: string) => {
			if (!user) throw new Error('Brak użytkownika.');
			await adminRemoveCourseCompletion(user.uid, courseId);
		},
		onSuccess: async () => {
			setError(null);
			await invalidate();
		},
		onError: (e) => {
			setError(e instanceof Error ? e.message : 'Nie udało się usunąć ukończenia.');
		},
	});

	const addBadgeMutation = useMutation({
		mutationFn: async () => {
			if (!user || !selectedBadge) throw new Error('Wybierz odznakę.');
			await adminAwardBadge({
				uid: user.uid,
				badge: selectedBadge,
				awardedAt: awardedAt || undefined,
			});
		},
		onSuccess: async () => {
			setSelectedBadge(null);
			setAwardedAt('');
			setError(null);
			await invalidate();
		},
		onError: (e) => {
			setError(e instanceof Error ? e.message : 'Nie udało się dodać odznaki.');
		},
	});

	const removeBadgeMutation = useMutation({
		mutationFn: async (badgeId: string) => {
			if (!user) throw new Error('Brak użytkownika.');
			await adminRemoveAwardedBadge(user.uid, badgeId);
		},
		onSuccess: async () => {
			setError(null);
			await invalidate();
		},
		onError: (e) => {
			setError(e instanceof Error ? e.message : 'Nie udało się usunąć odznaki.');
		},
	});

	const handleClose = () => {
		setSelectedCourse(null);
		setCompletedAt('');
		setSelectedBadge(null);
		setAwardedAt('');
		setError(null);
		onClose();
	};

	const loading = coursesLoading || badgesLoading || completionsLoading || awardsLoading;
	const busy =
		addCourseMutation.isPending ||
		removeCourseMutation.isPending ||
		addBadgeMutation.isPending ||
		removeBadgeMutation.isPending;

	return (
		<HardShadowDialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
			<DialogTitle sx={[hardShadowDialogTitleSx, { justifyContent: 'flex-start', gap: 1 }]}>
				<MilitaryTechIcon fontSize='small' />
				Ukończenia — {user?.displayName || user?.email || '…'}
			</DialogTitle>
			<DialogContent sx={[hardShadowDialogContentSx, { gap: 2 }]}>
				<ContentSwap state={loading ? 'loading' : 'content'}>
					{loading ? (
						<Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
							<CircularProgress size={24} />
						</Box>
					) : (
						<Stack spacing={3}>
							<Stack spacing={2.5}>
								<Typography variant='subtitle2' sx={{ fontWeight: 700 }}>
									Szkolenia
								</Typography>
								<Typography variant='body2' color='text.secondary'>
									Przypisz ukończone szkolenia (także sprzed platformy). Odznaka używa miniatury
									szkolenia z katalogu.
								</Typography>

								{completions.length === 0 ? (
									<Typography variant='body2' color='text.secondary'>
										Brak ukończeń.
									</Typography>
								) : (
									<Stack spacing={1.5}>
										{completions.map((item) => (
											<Box
												key={item.courseId}
												sx={{
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'space-between',
													gap: 1,
													border: '2px solid',
													borderColor: 'ink.main',
													p: 1.25,
												}}
											>
												<Box sx={{ minWidth: 0 }}>
													<Typography sx={{ fontWeight: 600 }} noWrap>
														{item.courseName}
													</Typography>
													<Typography variant='body2' color='text.secondary'>
														{formatDate(item.completedAt)}
													</Typography>
												</Box>
												<Button
													size='small'
													color='error'
													variant='outlined'
													disabled={busy}
													onClick={() => removeCourseMutation.mutate(item.courseId)}
												>
													Usuń
												</Button>
											</Box>
										))}
									</Stack>
								)}

								<Autocomplete
									options={availableCourses}
									getOptionLabel={(c) => c.name}
									value={selectedCourse}
									onChange={(_, val) => setSelectedCourse(val)}
									renderInput={(params) => (
										<TextField {...params} label='Dodaj szkolenie' />
									)}
									noOptionsText='Brak dostępnych szkoleń'
								/>
								<TextField
									label='Data ukończenia (opcjonalna)'
									type='date'
									value={completedAt}
									onChange={(e) => setCompletedAt(e.target.value)}
									slotProps={{ inputLabel: { shrink: true } }}
									helperText='Puste = dzisiejsza data'
								/>
								<Button
									variant='contained'
									disabled={!selectedCourse || busy}
									onClick={() => addCourseMutation.mutate()}
									sx={{ alignSelf: 'flex-start' }}
								>
									{addCourseMutation.isPending ? (
										<CircularProgress size={14} />
									) : (
										'Dodaj szkolenie'
									)}
								</Button>
							</Stack>

							<Box sx={{ borderTop: '2px solid', borderColor: 'ink.main', pt: 3 }}>
								<Stack spacing={2.5}>
									<Typography variant='subtitle2' sx={{ fontWeight: 700 }}>
										Odznaki własne
									</Typography>
									<Typography variant='body2' color='text.secondary'>
										Osiągnięcia spoza listy szkoleń. Definicje w Admin → Odznaki.
									</Typography>

									{awards.length === 0 ? (
										<Typography variant='body2' color='text.secondary'>
											Brak własnych odznak.
										</Typography>
									) : (
										<Stack spacing={1.5}>
											{awards.map((item) => (
												<Box
													key={item.badgeId}
													sx={{
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'space-between',
														gap: 1,
														border: '2px solid',
														borderColor: 'ink.main',
														p: 1.25,
													}}
												>
													<Stack
														direction='row'
														spacing={1.5}
														sx={{ alignItems: 'center', minWidth: 0 }}
													>
														{item.badgeImage ? (
															<Box
																component='img'
																src={item.badgeImage}
																alt=''
																sx={{
																	width: 36,
																	height: 36,
																	borderRadius: '50%',
																	border: '2px solid',
																	borderColor: 'ink.main',
																	objectFit: 'cover',
																	flexShrink: 0,
																}}
															/>
														) : null}
														<Box sx={{ minWidth: 0 }}>
															<Typography sx={{ fontWeight: 600 }} noWrap>
																{item.badgeName}
															</Typography>
															<Typography variant='body2' color='text.secondary'>
																{formatDate(item.awardedAt)}
															</Typography>
														</Box>
													</Stack>
													<Button
														size='small'
														color='error'
														variant='outlined'
														disabled={busy}
														onClick={() => removeBadgeMutation.mutate(item.badgeId)}
													>
														Usuń
													</Button>
												</Box>
											))}
										</Stack>
									)}

									<Autocomplete
										options={availableBadges}
										getOptionLabel={(b) => b.name}
										value={selectedBadge}
										onChange={(_, val) => setSelectedBadge(val)}
										renderInput={(params) => (
											<TextField {...params} label='Dodaj odznakę' />
										)}
										noOptionsText={
											badges.length === 0
												? 'Najpierw utwórz odznaki w Admin → Odznaki'
												: 'Brak dostępnych odznak'
										}
									/>
									<TextField
										label='Data przyznania (opcjonalna)'
										type='date'
										value={awardedAt}
										onChange={(e) => setAwardedAt(e.target.value)}
										slotProps={{ inputLabel: { shrink: true } }}
										helperText='Puste = dzisiejsza data'
									/>
									<Button
										variant='contained'
										disabled={!selectedBadge || busy}
										onClick={() => addBadgeMutation.mutate()}
										sx={{ alignSelf: 'flex-start' }}
									>
										{addBadgeMutation.isPending ? (
											<CircularProgress size={14} />
										) : (
											'Dodaj odznakę'
										)}
									</Button>
								</Stack>
							</Box>

							<MotionAlert show={Boolean(error)} severity='error'>
								{error}
							</MotionAlert>
						</Stack>
					)}
				</ContentSwap>
			</DialogContent>
			<DialogActions sx={hardShadowDialogActionsSx}>
				<Button onClick={handleClose} disabled={busy}>
					Zamknij
				</Button>
			</DialogActions>
		</HardShadowDialog>
	);
};
