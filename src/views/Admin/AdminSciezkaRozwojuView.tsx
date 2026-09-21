'use client';

import { Paths } from '@constants/paths';
import { getCourses } from '@services/courses';
import {
	DEFAULT_DEVELOPMENT_PATH,
	getDevelopmentPath,
	saveDevelopmentPath,
	seedDevelopmentPathIfMissing,
} from '@services/developmentPath';
import type {
	DevelopmentPathDocument,
	DevelopmentPathStep,
	DevelopmentPathTrack,
} from '@/types/developmentPath';
import {
	Box,
	Button,
	CircularProgress,
	ConfirmDialog,
	IconButton,
	MenuItem,
	Paper,
	Stack,
	TextField,
	Typography,
} from '@ui';
import { AddIcon, ArrowDownward, ArrowUpward, Delete, OpenInNewIcon } from '@ui/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { AdminGate } from './AdminGate';

const serialize = (doc: Pick<DevelopmentPathDocument, 'intro' | 'paths'>) =>
	JSON.stringify({ intro: doc.intro, paths: doc.paths });

export const AdminSciezkaRozwojuView = () => (
	<AdminGate>
		<SciezkaInner />
	</AdminGate>
);

const SciezkaInner = () => {
	const queryClient = useQueryClient();
	const { data, isLoading } = useQuery({
		queryKey: ['developmentPath'],
		queryFn: async () => {
			await seedDevelopmentPathIfMissing();
			return getDevelopmentPath();
		},
	});
	const { data: courses = [] } = useQuery({
		queryKey: ['courses'],
		queryFn: getCourses,
	});

	const [intro, setIntro] = useState('');
	const [paths, setPaths] = useState<DevelopmentPathTrack[]>([]);
	const [savedSnapshot, setSavedSnapshot] = useState('');
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [saveOpen, setSaveOpen] = useState(false);
	const [resetOpen, setResetOpen] = useState(false);
	const [addSlugByPath, setAddSlugByPath] = useState<Record<string, string>>({});

	useEffect(() => {
		if (data) {
			setIntro(data.intro);
			setPaths(data.paths);
			setSavedSnapshot(serialize(data));
		}
	}, [data]);

	const courseOptions = useMemo(
		() =>
			[...courses]
				.sort((a, b) => a.name.localeCompare(b.name, 'pl'))
				.map((c) => ({ value: c.slug, label: c.name })),
		[courses]
	);

	if (isLoading) return <CircularProgress />;

	const isDirty = serialize({ intro, paths }) !== savedSnapshot;

	const updatePath = (pathId: string, patch: Partial<DevelopmentPathTrack>) => {
		setPaths((prev) => prev.map((p) => (p.id === pathId ? { ...p, ...patch } : p)));
	};

	const moveStep = (pathId: string, index: number, direction: 'up' | 'down') => {
		setPaths((prev) =>
			prev.map((p) => {
				if (p.id !== pathId) return p;
				const swapIdx = direction === 'up' ? index - 1 : index + 1;
				if (swapIdx < 0 || swapIdx >= p.steps.length) return p;
				const steps = [...p.steps];
				const tmp = steps[index];
				steps[index] = steps[swapIdx];
				steps[swapIdx] = tmp;
				return { ...p, steps };
			})
		);
	};

	const removeStep = (pathId: string, index: number) => {
		setPaths((prev) =>
			prev.map((p) =>
				p.id === pathId
					? { ...p, steps: p.steps.filter((_, i) => i !== index) }
					: p
			)
		);
	};

	const updateStep = (pathId: string, index: number, patch: Partial<DevelopmentPathStep>) => {
		setPaths((prev) =>
			prev.map((p) => {
				if (p.id !== pathId) return p;
				const steps = p.steps.map((s, i) => (i === index ? { ...s, ...patch } : s));
				return { ...p, steps };
			})
		);
	};

	const addStep = (pathId: string) => {
		const slug = addSlugByPath[pathId]?.trim();
		if (!slug) return;
		setPaths((prev) =>
			prev.map((p) =>
				p.id === pathId
					? { ...p, steps: [...p.steps, { id: uuid(), courseSlug: slug }] }
					: p
			)
		);
		setAddSlugByPath((prev) => ({ ...prev, [pathId]: '' }));
	};

	const addPath = () => {
		setPaths((prev) => [
			...prev,
			{ id: uuid(), title: 'Nowa ścieżka', steps: [] },
		]);
	};

	const removePath = (pathId: string) => {
		setPaths((prev) => prev.filter((p) => p.id !== pathId));
	};

	const movePath = (index: number, direction: 'up' | 'down') => {
		const swapIdx = direction === 'up' ? index - 1 : index + 1;
		if (swapIdx < 0 || swapIdx >= paths.length) return;
		setPaths((prev) => {
			const next = [...prev];
			const tmp = next[index];
			next[index] = next[swapIdx];
			next[swapIdx] = tmp;
			return next;
		});
	};

	return (
		<Box sx={{ maxWidth: 960 }}>
			<Stack
				direction={{ xs: 'column', sm: 'row' }}
				sx={{ mb: 2, alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 1 }}
			>
				<Typography variant='h5'>Ścieżka rozwoju</Typography>
				<Button
					component='a'
					href={Paths.sciezkaRozwoju}
					target='_blank'
					rel='noopener noreferrer'
					startIcon={<OpenInNewIcon />}
					size='small'
				>
					Podgląd strony
				</Button>
			</Stack>
			{data?.updatedAt ? (
				<Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 2 }}>
					Ostatnia aktualizacja: {new Date(data.updatedAt).toLocaleString('pl-PL')}
				</Typography>
			) : null}

			<TextField
				fullWidth
				label='Wstęp'
				multiline
				minRows={2}
				value={intro}
				onChange={(e) => setIntro(e.target.value)}
				sx={{ mb: 3 }}
			/>

			<Stack spacing={3}>
				{paths.map((path, pathIdx) => (
					<Paper key={path.id} variant='outlined' sx={{ p: 2 }}>
						<Stack
							direction={{ xs: 'column', sm: 'row' }}
							sx={{ mb: 2, gap: 1, alignItems: { sm: 'flex-start' } }}
						>
							<TextField
								fullWidth
								label='Tytuł ścieżki'
								value={path.title}
								onChange={(e) => updatePath(path.id, { title: e.target.value })}
							/>
							<Stack direction='row' spacing={0.5}>
								<IconButton
									size='small'
									disabled={pathIdx === 0}
									onClick={() => movePath(pathIdx, 'up')}
									aria-label='Przenieś ścieżkę w górę'
								>
									<ArrowUpward fontSize='small' />
								</IconButton>
								<IconButton
									size='small'
									disabled={pathIdx === paths.length - 1}
									onClick={() => movePath(pathIdx, 'down')}
									aria-label='Przenieś ścieżkę w dół'
								>
									<ArrowDownward fontSize='small' />
								</IconButton>
								<IconButton
									size='small'
									color='error'
									onClick={() => removePath(path.id)}
									aria-label='Usuń ścieżkę'
								>
									<Delete fontSize='small' />
								</IconButton>
							</Stack>
						</Stack>

						<Stack spacing={1.5}>
							{path.steps.map((step, stepIdx) => (
								<Paper
									key={step.id}
									variant='outlined'
									sx={{ p: 1.5, display: 'flex', gap: 1, alignItems: 'flex-start' }}
								>
									<Box sx={{ display: 'flex', flexDirection: 'column' }}>
										<IconButton
											size='small'
											disabled={stepIdx === 0}
											onClick={() => moveStep(path.id, stepIdx, 'up')}
											aria-label='Przenieś krok w górę'
										>
											<ArrowUpward fontSize='small' />
										</IconButton>
										<IconButton
											size='small'
											disabled={stepIdx === path.steps.length - 1}
											onClick={() => moveStep(path.id, stepIdx, 'down')}
											aria-label='Przenieś krok w dół'
										>
											<ArrowDownward fontSize='small' />
										</IconButton>
									</Box>
									<Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
										<TextField
											select
											fullWidth
											size='small'
											label='Szkolenie'
											value={step.courseSlug}
											onChange={(e) =>
												updateStep(path.id, stepIdx, { courseSlug: e.target.value })
											}
										>
											{courseOptions.map((opt) => (
												<MenuItem key={opt.value} value={opt.value}>
													{opt.label}
												</MenuItem>
											))}
											{!courseOptions.some((o) => o.value === step.courseSlug) ? (
												<MenuItem value={step.courseSlug}>
													{step.courseSlug} (brak w katalogu)
												</MenuItem>
											) : null}
										</TextField>
										<TextField
											fullWidth
											size='small'
											label='Etykieta (opcjonalnie)'
											placeholder='Domyślnie: nazwa szkolenia'
											value={step.label ?? ''}
											onChange={(e) =>
												updateStep(path.id, stepIdx, {
													label: e.target.value || undefined,
												})
											}
										/>
									</Stack>
									<IconButton
										size='small'
										color='error'
										onClick={() => removeStep(path.id, stepIdx)}
										aria-label='Usuń krok'
									>
										<Delete fontSize='small' />
									</IconButton>
								</Paper>
							))}
						</Stack>

						<Stack
							direction={{ xs: 'column', sm: 'row' }}
							spacing={1}
							sx={{ mt: 2, alignItems: { sm: 'center' } }}
						>
							<TextField
								select
								fullWidth
								size='small'
								label='Dodaj szkolenie'
								value={addSlugByPath[path.id] ?? ''}
								onChange={(e) =>
									setAddSlugByPath((prev) => ({ ...prev, [path.id]: e.target.value }))
								}
							>
								<MenuItem value='' disabled>
									— wybierz —
								</MenuItem>
								{courseOptions.map((opt) => (
									<MenuItem key={opt.value} value={opt.value}>
										{opt.label}
									</MenuItem>
								))}
							</TextField>
							<Button
								variant='outlined'
								startIcon={<AddIcon />}
								disabled={!addSlugByPath[path.id]}
								onClick={() => addStep(path.id)}
								sx={{ flexShrink: 0 }}
							>
								Dodaj krok
							</Button>
						</Stack>
					</Paper>
				))}
			</Stack>

			<Button variant='outlined' startIcon={<AddIcon />} onClick={addPath} sx={{ mt: 2, mb: 3 }}>
				Dodaj ścieżkę
			</Button>

			{message ? (
				<Typography color='success.main' variant='body2' sx={{ mb: 1 }}>
					{message}
				</Typography>
			) : null}
			<Stack direction='row' spacing={1}>
				<Button
					variant='contained'
					disabled={saving || !isDirty}
					onClick={() => setSaveOpen(true)}
				>
					Zapisz
				</Button>
				<Button variant='outlined' disabled={saving} onClick={() => setResetOpen(true)}>
					Przywróć domyślny
				</Button>
			</Stack>

			<ConfirmDialog
				open={saveOpen}
				title='Potwierdź zapis ścieżki rozwoju'
				cancelLabel='Anuluj'
				confirmLabel='Zapisz'
				confirmColor='primary'
				loading={saving}
				onCancel={() => setSaveOpen(false)}
				onConfirm={() => {
					setSaving(true);
					setMessage(null);
					const payload = {
						intro: intro.trim(),
						paths: paths.map((p) => ({
							id: p.id,
							title: p.title.trim() || 'Ścieżka',
							steps: p.steps.map((s) => {
								const label = s.label?.trim();
								return label
									? { id: s.id, courseSlug: s.courseSlug, label }
									: { id: s.id, courseSlug: s.courseSlug };
							}),
						})),
					};
					void saveDevelopmentPath(payload)
						.then(async () => {
							setIntro(payload.intro);
							setPaths(payload.paths);
							setSavedSnapshot(serialize(payload));
							setMessage('Zapisano.');
							setSaveOpen(false);
							await queryClient.invalidateQueries({ queryKey: ['developmentPath'] });
						})
						.finally(() => setSaving(false));
				}}
			>
				Czy na pewno chcesz opublikować nową treść ścieżki rozwoju?
			</ConfirmDialog>

			<ConfirmDialog
				open={resetOpen}
				title='Potwierdź przywrócenie domyślnego'
				cancelLabel='Anuluj'
				confirmLabel='Przywróć'
				confirmColor='warning'
				onCancel={() => setResetOpen(false)}
				onConfirm={() => {
					setIntro(DEFAULT_DEVELOPMENT_PATH.intro);
					setPaths(DEFAULT_DEVELOPMENT_PATH.paths);
					setResetOpen(false);
				}}
			>
				Czy na pewno chcesz zastąpić bieżącą treść domyślnymi ścieżkami? Zmiany nie zostaną
				zapisane, dopóki nie klikniesz „Zapisz”.
			</ConfirmDialog>
		</Box>
	);
};
