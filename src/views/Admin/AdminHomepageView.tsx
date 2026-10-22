'use client';

import { AdminStickyActions, MarkdownWysiwygEditor } from '@components';
import { HOMEPAGE_HERO_IMAGES, toHomepageHeroImage } from '@constants/homepageHeroImages';
import { Paths } from '@constants/paths';
import {
	DEFAULT_HOMEPAGE,
	getHomepage,
	saveHomepage,
	seedHomepageIfMissing,
} from '@services/homepage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
	Box,
	Button,
	CircularProgress,
	ConfirmDialog,
	ContentSwap,
	IconButton,
	MenuItem,
	MotionAlert,
	Paper,
	Stack,
	Stagger,
	StaggerItem,
	TextField,
	Typography,
} from '@ui';
import { AddIcon, ArrowDownward, ArrowUpward, Delete, OpenInNewIcon } from '@ui/icons';
import { useEffect, useState } from 'react';
import { v4 as uuid } from 'uuid';
import type {
	HomepageMissionPoint,
	HomepageWayOfWorking,
	HomepageWritable,
} from '@/types/homepage';

const serialize = (doc: HomepageWritable) => JSON.stringify(doc);

const emptyWay = (): HomepageWayOfWorking => ({
	id: uuid(),
	title: '',
	description: '',
});

const emptyMissionPoint = (): HomepageMissionPoint => ({
	id: uuid(),
	title: '',
	body: '',
});

const joinMissionBody = (points: HomepageMissionPoint[]) =>
	points.map((p) => p.body.trim()).filter(Boolean).join('\n\n');

export const AdminHomepageView = () => <HomepageInner />;

const HomepageInner = () => {
	const queryClient = useQueryClient();
	const { data, isLoading } = useQuery({
		queryKey: ['homepage'],
		queryFn: async () => {
			await seedHomepageIfMissing();
			return getHomepage();
		},
	});

	const [form, setForm] = useState<HomepageWritable>({ ...DEFAULT_HOMEPAGE });
	const [savedSnapshot, setSavedSnapshot] = useState('');
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [saveOpen, setSaveOpen] = useState(false);
	const [resetOpen, setResetOpen] = useState(false);

	useEffect(() => {
		if (data) {
			const next: HomepageWritable = {
				heroHeadline: data.heroHeadline,
				heroSubline: data.heroSubline,
				heroImage: data.heroImage,
				introTitle: data.introTitle,
				introSubline: data.introSubline,
				introMarkdown: data.introMarkdown,
				introBannerImage: data.introBannerImage,
				missionTitle: data.missionTitle,
				missionPoints: data.missionPoints,
				missionBody: data.missionBody,
				waysOfWorking: data.waysOfWorking,
				growthPathTeaser: data.growthPathTeaser,
				privateIndividualTitle: data.privateIndividualTitle,
				privateIndividualBody: data.privateIndividualBody,
				privateGroupTitle: data.privateGroupTitle,
				privateGroupBody: data.privateGroupBody,
			};
			setForm(next);
			setSavedSnapshot(serialize(next));
		}
	}, [data]);

	const isDirty = serialize(form) !== savedSnapshot;

	const patch = (partial: Partial<HomepageWritable>) => {
		setForm((prev) => ({ ...prev, ...partial }));
	};

	const updateWay = (id: string, partial: Partial<HomepageWayOfWorking>) => {
		setForm((prev) => ({
			...prev,
			waysOfWorking: prev.waysOfWorking.map((w) => (w.id === id ? { ...w, ...partial } : w)),
		}));
	};

	const updateMissionPoint = (id: string, partial: Partial<HomepageMissionPoint>) => {
		setForm((prev) => ({
			...prev,
			missionPoints: prev.missionPoints.map((p) => (p.id === id ? { ...p, ...partial } : p)),
		}));
	};

	const moveListItem = <T,>(list: T[], index: number, delta: number): T[] | null => {
		const next = [...list];
		const target = index + delta;
		if (target < 0 || target >= next.length) return null;
		const tmp = next[index];
		const swap = next[target];
		if (!tmp || !swap) return null;
		next[index] = swap;
		next[target] = tmp;
		return next;
	};

	const moveWay = (index: number, delta: number) => {
		setForm((prev) => {
			const next = moveListItem(prev.waysOfWorking, index, delta);
			return next ? { ...prev, waysOfWorking: next } : prev;
		});
	};

	const moveMissionPoint = (index: number, delta: number) => {
		setForm((prev) => {
			const next = moveListItem(prev.missionPoints, index, delta);
			return next ? { ...prev, missionPoints: next } : prev;
		});
	};

	const removeWay = (id: string) => {
		setForm((prev) => ({
			...prev,
			waysOfWorking: prev.waysOfWorking.filter((w) => w.id !== id),
		}));
	};

	const removeMissionPoint = (id: string) => {
		setForm((prev) => ({
			...prev,
			missionPoints: prev.missionPoints.filter((p) => p.id !== id),
		}));
	};

	const addWay = () => {
		setForm((prev) => ({
			...prev,
			waysOfWorking: [...prev.waysOfWorking, emptyWay()],
		}));
	};

	const addMissionPoint = () => {
		setForm((prev) => ({
			...prev,
			missionPoints: [...prev.missionPoints, emptyMissionPoint()],
		}));
	};

	const buildPayload = (): HomepageWritable => {
		const missionPoints = form.missionPoints
			.map((p) => ({ id: p.id, title: p.title.trim(), body: p.body.trim() }))
			.filter((p) => p.body);
		const resolvedPoints =
			missionPoints.length > 0 ? missionPoints : DEFAULT_HOMEPAGE.missionPoints;
		return {
			heroHeadline: form.heroHeadline.trim() || DEFAULT_HOMEPAGE.heroHeadline,
			heroSubline: form.heroSubline.trim() || DEFAULT_HOMEPAGE.heroSubline,
			heroImage: toHomepageHeroImage(form.heroImage) ?? DEFAULT_HOMEPAGE.heroImage,
			introTitle: form.introTitle.trim() || DEFAULT_HOMEPAGE.introTitle,
			introSubline: form.introSubline.trim() || DEFAULT_HOMEPAGE.introSubline,
			introMarkdown: form.introMarkdown.trim() || DEFAULT_HOMEPAGE.introMarkdown,
			introBannerImage:
				toHomepageHeroImage(form.introBannerImage) ?? DEFAULT_HOMEPAGE.introBannerImage,
			missionTitle: form.missionTitle.trim() || DEFAULT_HOMEPAGE.missionTitle,
			missionPoints: resolvedPoints,
			missionBody: joinMissionBody(resolvedPoints),
			waysOfWorking: form.waysOfWorking
				.map((w) => ({
					id: w.id,
					title: w.title.trim(),
					description: w.description.trim(),
				}))
				.filter((w) => w.title && w.description),
			growthPathTeaser: form.growthPathTeaser.trim() || DEFAULT_HOMEPAGE.growthPathTeaser,
			privateIndividualTitle:
				form.privateIndividualTitle.trim() || DEFAULT_HOMEPAGE.privateIndividualTitle,
			privateIndividualBody:
				form.privateIndividualBody.trim() || DEFAULT_HOMEPAGE.privateIndividualBody,
			privateGroupTitle: form.privateGroupTitle.trim() || DEFAULT_HOMEPAGE.privateGroupTitle,
			privateGroupBody: form.privateGroupBody.trim() || DEFAULT_HOMEPAGE.privateGroupBody,
		};
	};

	return (
		<ContentSwap state={isLoading ? 'loading' : 'content'}>
			{isLoading ? (
				<CircularProgress />
			) : (
		<Box sx={{ width: '100%' }}>
			<Stack
				direction={{ xs: 'column', sm: 'row' }}
				spacing={1}
				sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', mb: 2 }}
			>
				<Typography variant='h5'>Strona główna</Typography>
				<Button
					component='a'
					href={Paths.home}
					target='_blank'
					rel='noopener noreferrer'
					variant='outlined'
					size='small'
					endIcon={<OpenInNewIcon />}
				>
					Podgląd
				</Button>
			</Stack>

			<Typography variant='subtitle1' sx={{ mb: 1, fontWeight: 700 }}>
				Hero
			</Typography>
			<Stack spacing={2} sx={{ mb: 3 }}>
				<TextField
					label='Nagłówek'
					fullWidth
					value={form.heroHeadline}
					onChange={(e) => patch({ heroHeadline: e.target.value })}
				/>
				<TextField
					label='Podtytuł'
					fullWidth
					multiline
					minRows={2}
					value={form.heroSubline}
					onChange={(e) => patch({ heroSubline: e.target.value })}
				/>
				<TextField
					select
					label='Obraz hero'
					fullWidth
					value={form.heroImage}
					onChange={(e) => patch({ heroImage: e.target.value })}
				>
					{HOMEPAGE_HERO_IMAGES.map((src) => (
						<MenuItem key={src} value={src}>
							{src}
						</MenuItem>
					))}
				</TextField>
			</Stack>

			<Typography variant='subtitle1' sx={{ mb: 1, fontWeight: 700 }}>
				Sekcja pod hero
			</Typography>
			<Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>
				Baner, tytuł, podtytuł oraz treść w Markdown — wyświetlane bezpośrednio pod hero.
			</Typography>
			<Stack spacing={2} sx={{ mb: 3 }}>
				<TextField
					label='Tytuł'
					fullWidth
					value={form.introTitle}
					onChange={(e) => patch({ introTitle: e.target.value })}
				/>
				<TextField
					label='Podtytuł'
					fullWidth
					multiline
					minRows={2}
					value={form.introSubline}
					onChange={(e) => patch({ introSubline: e.target.value })}
				/>
				<TextField
					select
					label='Obraz banera'
					fullWidth
					value={form.introBannerImage}
					onChange={(e) => patch({ introBannerImage: e.target.value })}
					helperText='Katalog /hero — ten sam zestaw co hero'
				>
					{HOMEPAGE_HERO_IMAGES.map((src) => (
						<MenuItem key={src} value={src}>
							{src}
						</MenuItem>
					))}
				</TextField>
				<Box>
					<Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
						Treść (Markdown)
					</Typography>
					<MarkdownWysiwygEditor
						value={form.introMarkdown}
						onChange={(value) => patch({ introMarkdown: value })}
						height={320}
					/>
				</Box>
			</Stack>

			<Typography variant='subtitle1' sx={{ mb: 1, fontWeight: 700 }}>
				Sposób pracy
			</Typography>
			<Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>
				Jeden nagłówek, akapity wstępu z pixel-art oraz lista punktów z tytułami.
			</Typography>
			<TextField
				label='Tytuł sekcji'
				fullWidth
				value={form.missionTitle}
				onChange={(e) => patch({ missionTitle: e.target.value })}
				sx={{ mb: 2 }}
			/>
			<Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
				Wstęp — ikony po id: small-groups, reps, practical
			</Typography>
			<Stagger sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 1 }}>
				{form.missionPoints.map((point, index) => (
					<StaggerItem key={point.id}>
						<Paper variant='outlined' sx={{ p: 2 }}>
							<Stack spacing={1.5}>
								<Stack direction='row' spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
									<IconButton
										size='small'
										aria-label='Przenieś w górę'
										disabled={index === 0}
										onClick={() => moveMissionPoint(index, -1)}
									>
										<ArrowUpward fontSize='small' />
									</IconButton>
									<IconButton
										size='small'
										aria-label='Przenieś w dół'
										disabled={index === form.missionPoints.length - 1}
										onClick={() => moveMissionPoint(index, 1)}
									>
										<ArrowDownward fontSize='small' />
									</IconButton>
									<IconButton
										size='small'
										aria-label='Usuń'
										onClick={() => removeMissionPoint(point.id)}
									>
										<Delete fontSize='small' />
									</IconButton>
								</Stack>
								<TextField
									label='Id (ikona)'
									fullWidth
									size='small'
									value={point.id}
									onChange={(e) =>
										setForm((prev) => ({
											...prev,
											missionPoints: prev.missionPoints.map((p) =>
												p.id === point.id ? { ...p, id: e.target.value } : p
											),
										}))
									}
								/>
								<TextField
									label='Tytuł'
									fullWidth
									value={point.title}
									onChange={(e) => updateMissionPoint(point.id, { title: e.target.value })}
								/>
								<TextField
									label='Tekst'
									fullWidth
									multiline
									minRows={2}
									value={point.body}
									onChange={(e) => updateMissionPoint(point.id, { body: e.target.value })}
								/>
							</Stack>
						</Paper>
					</StaggerItem>
				))}
			</Stagger>
			<Button
				variant='outlined'
				startIcon={<AddIcon />}
				onClick={addMissionPoint}
				sx={{ mb: 3 }}
			>
				Dodaj akapit wstępu
			</Button>
			<Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
				Punkty z tytułem — ikony po id: practice, own-gun, path, debrief,
				materials-training
			</Typography>
			<Stagger sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
				{form.waysOfWorking.map((way, index) => (
					<StaggerItem key={way.id}>
					<Paper variant='outlined' sx={{ p: 2 }}>
						<Stack spacing={1.5}>
							<Stack direction='row' spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
								<IconButton
									size='small'
									aria-label='Przenieś w górę'
									disabled={index === 0}
									onClick={() => moveWay(index, -1)}
								>
									<ArrowUpward fontSize='small' />
								</IconButton>
								<IconButton
									size='small'
									aria-label='Przenieś w dół'
									disabled={index === form.waysOfWorking.length - 1}
									onClick={() => moveWay(index, 1)}
								>
									<ArrowDownward fontSize='small' />
								</IconButton>
								<IconButton size='small' aria-label='Usuń' onClick={() => removeWay(way.id)}>
									<Delete fontSize='small' />
								</IconButton>
							</Stack>
							<TextField
								label='Tytuł'
								fullWidth
								value={way.title}
								onChange={(e) => updateWay(way.id, { title: e.target.value })}
							/>
							<TextField
								label='Opis'
								fullWidth
								multiline
								minRows={2}
								value={way.description}
								onChange={(e) => updateWay(way.id, { description: e.target.value })}
							/>
						</Stack>
					</Paper>
					</StaggerItem>
				))}
			</Stagger>
			<Button variant='outlined' startIcon={<AddIcon />} onClick={addWay} sx={{ mb: 3 }}>
				Dodaj punkt
			</Button>

			<Typography variant='subtitle1' sx={{ mb: 1, fontWeight: 700 }}>
				Ścieżka rozwoju
			</Typography>
			<TextField
				label='Teaser'
				fullWidth
				multiline
				minRows={2}
				value={form.growthPathTeaser}
				onChange={(e) => patch({ growthPathTeaser: e.target.value })}
				sx={{ mb: 3 }}
			/>

			<Typography variant='subtitle1' sx={{ mb: 1, fontWeight: 700 }}>
				Indywidualne i grupy
			</Typography>
			<Stack spacing={2} sx={{ mb: 3 }}>
				<TextField
					label='Tytuł — indywidualne'
					fullWidth
					value={form.privateIndividualTitle}
					onChange={(e) => patch({ privateIndividualTitle: e.target.value })}
				/>
				<TextField
					label='Treść — indywidualne'
					fullWidth
					multiline
					minRows={2}
					value={form.privateIndividualBody}
					onChange={(e) => patch({ privateIndividualBody: e.target.value })}
				/>
				<TextField
					label='Tytuł — grupy'
					fullWidth
					value={form.privateGroupTitle}
					onChange={(e) => patch({ privateGroupTitle: e.target.value })}
				/>
				<TextField
					label='Treść — grupy'
					fullWidth
					multiline
					minRows={2}
					value={form.privateGroupBody}
					onChange={(e) => patch({ privateGroupBody: e.target.value })}
				/>
			</Stack>

			<MotionAlert show={Boolean(message)} severity='success' sx={{ mb: 1 }}>
				{message}
			</MotionAlert>
			<AdminStickyActions>
				<Button variant='contained' disabled={saving || !isDirty} onClick={() => setSaveOpen(true)}>
					Zapisz
				</Button>
				<Button variant='outlined' disabled={saving} onClick={() => setResetOpen(true)}>
					Przywróć domyślny
				</Button>
			</AdminStickyActions>

			<ConfirmDialog
				open={saveOpen}
				title='Potwierdź zapis strony głównej'
				cancelLabel='Anuluj'
				confirmLabel='Zapisz'
				confirmColor='primary'
				loading={saving}
				onCancel={() => setSaveOpen(false)}
				onConfirm={() => {
					setSaving(true);
					setMessage(null);
					const payload = buildPayload();
					const ways =
						payload.waysOfWorking.length > 0
							? payload.waysOfWorking
							: DEFAULT_HOMEPAGE.waysOfWorking;
					const toSave = { ...payload, waysOfWorking: ways };
					void saveHomepage(toSave)
						.then(async () => {
							setForm(toSave);
							setSavedSnapshot(serialize(toSave));
							setMessage('Zapisano.');
							setSaveOpen(false);
							await queryClient.invalidateQueries({ queryKey: ['homepage'] });
						})
						.finally(() => setSaving(false));
				}}
			>
				Czy na pewno chcesz opublikować nową treść strony głównej?
			</ConfirmDialog>

			<ConfirmDialog
				open={resetOpen}
				title='Potwierdź przywrócenie domyślnego'
				cancelLabel='Anuluj'
				confirmLabel='Przywróć'
				confirmColor='warning'
				onCancel={() => setResetOpen(false)}
				onConfirm={() => {
					setForm({ ...DEFAULT_HOMEPAGE });
					setResetOpen(false);
				}}
			>
				Czy na pewno chcesz zastąpić bieżącą treść domyślną? Zmiany nie zostaną zapisane, dopóki nie
				klikniesz „Zapisz”.
			</ConfirmDialog>
		</Box>
			)}
		</ContentSwap>
	);
};
