'use client';

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
	IconButton,
	MenuItem,
	Paper,
	Stack,
	TextField,
	Typography,
} from '@ui';
import { AddIcon, ArrowDownward, ArrowUpward, Delete, OpenInNewIcon } from '@ui/icons';
import { useEffect, useState } from 'react';
import { v4 as uuid } from 'uuid';
import type { HomepageWayOfWorking, HomepageWritable } from '@/types/homepage';

const serialize = (doc: HomepageWritable) => JSON.stringify(doc);

const emptyWay = (): HomepageWayOfWorking => ({
	id: uuid(),
	title: '',
	description: '',
});

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
				missionTitle: data.missionTitle,
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

	if (isLoading) return <CircularProgress />;

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

	const moveWay = (index: number, delta: number) => {
		setForm((prev) => {
			const next = [...prev.waysOfWorking];
			const target = index + delta;
			if (target < 0 || target >= next.length) return prev;
			const tmp = next[index];
			const swap = next[target];
			if (!tmp || !swap) return prev;
			next[index] = swap;
			next[target] = tmp;
			return { ...prev, waysOfWorking: next };
		});
	};

	const removeWay = (id: string) => {
		setForm((prev) => ({
			...prev,
			waysOfWorking: prev.waysOfWorking.filter((w) => w.id !== id),
		}));
	};

	const addWay = () => {
		setForm((prev) => ({
			...prev,
			waysOfWorking: [...prev.waysOfWorking, emptyWay()],
		}));
	};

	const buildPayload = (): HomepageWritable => ({
		heroHeadline: form.heroHeadline.trim() || DEFAULT_HOMEPAGE.heroHeadline,
		heroSubline: form.heroSubline.trim() || DEFAULT_HOMEPAGE.heroSubline,
		heroImage: toHomepageHeroImage(form.heroImage) ?? DEFAULT_HOMEPAGE.heroImage,
		missionTitle: form.missionTitle.trim() || DEFAULT_HOMEPAGE.missionTitle,
		missionBody: form.missionBody.trim() || DEFAULT_HOMEPAGE.missionBody,
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
	});

	return (
		<Box sx={{ maxWidth: 800 }}>
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
				Misja
			</Typography>
			<Stack spacing={2} sx={{ mb: 3 }}>
				<TextField
					label='Tytuł sekcji'
					fullWidth
					value={form.missionTitle}
					onChange={(e) => patch({ missionTitle: e.target.value })}
				/>
				<TextField
					label='Treść'
					fullWidth
					multiline
					minRows={3}
					value={form.missionBody}
					onChange={(e) => patch({ missionBody: e.target.value })}
				/>
			</Stack>

			<Typography variant='subtitle1' sx={{ mb: 1, fontWeight: 700 }}>
				Jak pracujemy
			</Typography>
			<Stack spacing={2} sx={{ mb: 2 }}>
				{form.waysOfWorking.map((way, index) => (
					<Paper key={way.id} variant='outlined' sx={{ p: 2 }}>
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
				))}
			</Stack>
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

			{message ? (
				<Typography color='success.main' variant='body2' sx={{ mb: 1 }}>
					{message}
				</Typography>
			) : null}
			<Stack direction='row' spacing={1}>
				<Button variant='contained' disabled={saving || !isDirty} onClick={() => setSaveOpen(true)}>
					Zapisz
				</Button>
				<Button variant='outlined' disabled={saving} onClick={() => setResetOpen(true)}>
					Przywróć domyślny
				</Button>
			</Stack>

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
	);
};
