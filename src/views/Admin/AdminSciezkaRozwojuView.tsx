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
	DevelopmentPathLevel,
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

const cleanStep = (s: DevelopmentPathStep): DevelopmentPathStep => {
	const label = s.label?.trim();
	return label
		? { id: s.id, courseSlug: s.courseSlug, label }
		: { id: s.id, courseSlug: s.courseSlug };
};

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
	/** pathId → slug for new level */
	const [addLevelSlugByPath, setAddLevelSlugByPath] = useState<Record<string, string>>({});
	/** `${pathId}:${levelId}` → slug for sibling on same level */
	const [addItemSlugByLevel, setAddItemSlugByLevel] = useState<Record<string, string>>({});

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

	const mapLevels = (
		pathId: string,
		fn: (levels: DevelopmentPathLevel[]) => DevelopmentPathLevel[]
	) => {
		setPaths((prev) =>
			prev.map((p) => (p.id === pathId ? { ...p, levels: fn(p.levels) } : p))
		);
	};

	const moveLevel = (pathId: string, index: number, direction: 'up' | 'down') => {
		mapLevels(pathId, (levels) => {
			const swapIdx = direction === 'up' ? index - 1 : index + 1;
			if (swapIdx < 0 || swapIdx >= levels.length) return levels;
			const next = [...levels];
			const tmp = next[index];
			next[index] = next[swapIdx];
			next[swapIdx] = tmp;
			return next;
		});
	};

	const removeLevel = (pathId: string, levelId: string) => {
		mapLevels(pathId, (levels) => levels.filter((l) => l.id !== levelId));
	};

	const moveItem = (
		pathId: string,
		levelId: string,
		index: number,
		direction: 'up' | 'down'
	) => {
		mapLevels(pathId, (levels) =>
			levels.map((l) => {
				if (l.id !== levelId) return l;
				const swapIdx = direction === 'up' ? index - 1 : index + 1;
				if (swapIdx < 0 || swapIdx >= l.items.length) return l;
				const items = [...l.items];
				const tmp = items[index];
				items[index] = items[swapIdx];
				items[swapIdx] = tmp;
				return { ...l, items };
			})
		);
	};

	const removeItem = (pathId: string, levelId: string, itemId: string) => {
		mapLevels(pathId, (levels) =>
			levels
				.map((l) => {
					if (l.id !== levelId) return l;
					return { ...l, items: l.items.filter((i) => i.id !== itemId) };
				})
				.filter((l) => l.items.length > 0)
		);
	};

	const updateItem = (
		pathId: string,
		levelId: string,
		itemId: string,
		patch: Partial<DevelopmentPathStep>
	) => {
		mapLevels(pathId, (levels) =>
			levels.map((l) => {
				if (l.id !== levelId) return l;
				return {
					...l,
					items: l.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)),
				};
			})
		);
	};

	const addLevel = (pathId: string) => {
		const slug = addLevelSlugByPath[pathId]?.trim();
		if (!slug) return;
		mapLevels(pathId, (levels) => [
			...levels,
			{ id: uuid(), items: [{ id: uuid(), courseSlug: slug }] },
		]);
		setAddLevelSlugByPath((prev) => ({ ...prev, [pathId]: '' }));
	};

	const addItemToLevel = (pathId: string, levelId: string) => {
		const key = `${pathId}:${levelId}`;
		const slug = addItemSlugByLevel[key]?.trim();
		if (!slug) return;
		mapLevels(pathId, (levels) =>
			levels.map((l) =>
				l.id === levelId
					? { ...l, items: [...l.items, { id: uuid(), courseSlug: slug }] }
					: l
			)
		);
		setAddItemSlugByLevel((prev) => ({ ...prev, [key]: '' }));
	};

	const addPath = () => {
		setPaths((prev) => [...prev, { id: uuid(), title: 'Nowa ścieżka', levels: [] }]);
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

						<Stack spacing={2}>
							{path.levels.map((lvl, levelIdx) => {
								const addKey = `${path.id}:${lvl.id}`;
								return (
									<Paper key={lvl.id} variant='outlined' sx={{ p: 1.5, bgcolor: 'action.hover' }}>
										<Stack
											direction='row'
											sx={{ mb: 1, alignItems: 'center', justifyContent: 'space-between' }}
										>
											<Typography variant='caption' sx={{ fontWeight: 700 }}>
												Poziom {levelIdx + 1}
												{lvl.items.length > 1 ? ` (${lvl.items.length} równolegle)` : ''}
											</Typography>
											<Stack direction='row' spacing={0.5}>
												<IconButton
													size='small'
													disabled={levelIdx === 0}
													onClick={() => moveLevel(path.id, levelIdx, 'up')}
													aria-label='Przenieś poziom w górę'
												>
													<ArrowUpward fontSize='small' />
												</IconButton>
												<IconButton
													size='small'
													disabled={levelIdx === path.levels.length - 1}
													onClick={() => moveLevel(path.id, levelIdx, 'down')}
													aria-label='Przenieś poziom w dół'
												>
													<ArrowDownward fontSize='small' />
												</IconButton>
												<IconButton
													size='small'
													color='error'
													onClick={() => removeLevel(path.id, lvl.id)}
													aria-label='Usuń poziom'
												>
													<Delete fontSize='small' />
												</IconButton>
											</Stack>
										</Stack>

										<Stack spacing={1.5}>
											{lvl.items.map((item, itemIdx) => (
												<Paper
													key={item.id}
													variant='outlined'
													sx={{
														p: 1.5,
														display: 'flex',
														gap: 1,
														alignItems: 'flex-start',
														bgcolor: 'background.paper',
													}}
												>
													<Box sx={{ display: 'flex', flexDirection: 'column' }}>
														<IconButton
															size='small'
															disabled={itemIdx === 0}
															onClick={() => moveItem(path.id, lvl.id, itemIdx, 'up')}
															aria-label='Przenieś element w górę'
														>
															<ArrowUpward fontSize='small' />
														</IconButton>
														<IconButton
															size='small'
															disabled={itemIdx === lvl.items.length - 1}
															onClick={() => moveItem(path.id, lvl.id, itemIdx, 'down')}
															aria-label='Przenieś element w dół'
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
															value={item.courseSlug}
															onChange={(e) =>
																updateItem(path.id, lvl.id, item.id, {
																	courseSlug: e.target.value,
																})
															}
														>
															{courseOptions.map((opt) => (
																<MenuItem key={opt.value} value={opt.value}>
																	{opt.label}
																</MenuItem>
															))}
															{!courseOptions.some((o) => o.value === item.courseSlug) ? (
																<MenuItem value={item.courseSlug}>
																	{item.courseSlug} (brak w katalogu)
																</MenuItem>
															) : null}
														</TextField>
														<TextField
															fullWidth
															size='small'
															label='Etykieta (opcjonalnie)'
															placeholder='Domyślnie: nazwa szkolenia'
															value={item.label ?? ''}
															onChange={(e) =>
																updateItem(path.id, lvl.id, item.id, {
																	label: e.target.value || undefined,
																})
															}
														/>
													</Stack>
													<IconButton
														size='small'
														color='error'
														onClick={() => removeItem(path.id, lvl.id, item.id)}
														aria-label='Usuń element'
													>
														<Delete fontSize='small' />
													</IconButton>
												</Paper>
											))}
										</Stack>

										<Stack
											direction={{ xs: 'column', sm: 'row' }}
											spacing={1}
											sx={{ mt: 1.5, alignItems: { sm: 'center' } }}
										>
											<TextField
												select
												fullWidth
												size='small'
												label='Dodaj na tym poziomie'
												value={addItemSlugByLevel[addKey] ?? ''}
												onChange={(e) =>
													setAddItemSlugByLevel((prev) => ({
														...prev,
														[addKey]: e.target.value,
													}))
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
												size='small'
												startIcon={<AddIcon />}
												disabled={!addItemSlugByLevel[addKey]}
												onClick={() => addItemToLevel(path.id, lvl.id)}
												sx={{ flexShrink: 0 }}
											>
												Dodaj równolegle
											</Button>
										</Stack>
									</Paper>
								);
							})}
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
								label='Dodaj nowy poziom'
								value={addLevelSlugByPath[path.id] ?? ''}
								onChange={(e) =>
									setAddLevelSlugByPath((prev) => ({ ...prev, [path.id]: e.target.value }))
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
								disabled={!addLevelSlugByPath[path.id]}
								onClick={() => addLevel(path.id)}
								sx={{ flexShrink: 0 }}
							>
								Dodaj poziom
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
							levels: p.levels.map((l) => ({
								id: l.id,
								items: l.items.map(cleanStep),
							})),
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
