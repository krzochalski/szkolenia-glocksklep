'use client';

import { AdminStickyActions } from '@components';
import {
	Box,
	Button,
	Checkbox,
	Divider,
	FormControlLabel,
	Paper,
	TextField,
	Typography,
} from '@ui';
import { useState } from 'react';
import type {
	CourseDescription,
	CourseDescriptionSection,
	CourseDescriptionSectionKey,
	CourseModuleData,
	CourseRequirements,
} from '@/types/courseDescription';
import { extractYoutubeId } from '@/utils/youtube';
import {
	ListSectionEditor,
	ModulesEditor,
	SectionTitleWithCheckbox,
} from './CourseDescriptionFormEditors';
import {
	CourseSessionMediaFields,
	normalizeGalleryForSave,
} from './CourseSessionMediaFields';
import { SectionTitle } from './SectionTitle';

type CourseDescriptionFormProps = {
	readonly slug: string;
	readonly defaultValues: CourseDescription | null;
	readonly onSubmit: (data: Omit<CourseDescription, 'id'>) => Promise<void>;
};

const emptySection = (): CourseDescriptionSection => ({ items: [] });

const emptyRequirements = (): CourseRequirements => ({
	ownGun: false,
	holster: false,
});

const hasRequirementsToSave = (req: CourseRequirements): boolean =>
	req.ownGun || req.holster || (typeof req.roundCount === 'number' && req.roundCount > 0);

export const CourseDescriptionForm = ({
	slug,
	defaultValues,
	onSubmit,
}: CourseDescriptionFormProps) => {
	const [eyebrow, setEyebrow] = useState(defaultValues?.eyebrow ?? '');
	const [headline0, setHeadline0] = useState(defaultValues?.headline?.[0] ?? '');
	const [headline1, setHeadline1] = useState(defaultValues?.headline?.[1] ?? '');
	const [description, setDescription] = useState(defaultValues?.description ?? '');
	const [modules, setModules] = useState<CourseModuleData[]>(defaultValues?.modules ?? []);
	const [forWhom, setForWhom] = useState<CourseDescriptionSection>(
		defaultValues?.forWhom ?? emptySection()
	);
	const [notExpect, setNotExpect] = useState<CourseDescriptionSection>(
		defaultValues?.notExpect ?? emptySection()
	);
	const [bring, setBring] = useState<CourseDescriptionSection>(
		defaultValues?.bring ?? emptySection()
	);
	const [dontBring, setDontBring] = useState<CourseDescriptionSection>(
		defaultValues?.dontBring ?? emptySection()
	);
	const [outcomes, setOutcomes] = useState<CourseDescriptionSection>(
		defaultValues?.outcomes ?? emptySection()
	);
	const [requirements, setRequirements] = useState<CourseRequirements>(
		defaultValues?.requirements ?? emptyRequirements()
	);
	const [gallery, setGallery] = useState<string[]>(defaultValues?.gallery ?? []);
	const [sessionVideoUrl, setSessionVideoUrl] = useState(defaultValues?.sessionVideoUrl ?? '');
	const [videoError, setVideoError] = useState<string | undefined>();
	const [visibleInParticipantPanel, setVisibleInParticipantPanel] = useState<
		CourseDescriptionSectionKey[]
	>(defaultValues?.visibleInParticipantPanel ?? []);
	const [submitting, setSubmitting] = useState(false);

	const togglePanelSection = (key: CourseDescriptionSectionKey) => {
		setVisibleInParticipantPanel((prev) =>
			prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
		);
	};

	const handleSubmit = async () => {
		const trimmedVideo = sessionVideoUrl.trim();
		if (trimmedVideo && !extractYoutubeId(trimmedVideo)) {
			setVideoError('Podaj prawidłowy link YouTube');
			return;
		}
		setVideoError(undefined);
		setSubmitting(true);
		try {
			const galleryPaths = normalizeGalleryForSave(gallery);
			const data: Omit<CourseDescription, 'id'> = {
				slug,
				eyebrow,
				headline: [headline0, headline1],
				description,
				// Preserve existing image paths — edited on the course form.
				...(defaultValues?.thumbnail ? { thumbnail: defaultValues.thumbnail } : {}),
				...(defaultValues?.hero ? { hero: defaultValues.hero } : {}),
				...(defaultValues?.background ? { background: defaultValues.background } : {}),
				...(modules.length > 0 ? { modules } : {}),
				...(forWhom.items.length > 0 ? { forWhom } : {}),
				...(notExpect.items.length > 0 ? { notExpect } : {}),
				...(bring.items.length > 0 ? { bring } : {}),
				...(dontBring.items.length > 0 ? { dontBring } : {}),
				...(outcomes.items.length > 0 ? { outcomes } : {}),
				...(hasRequirementsToSave(requirements)
					? {
							requirements: {
								ownGun: requirements.ownGun,
								holster: requirements.holster,
								...(typeof requirements.roundCount === 'number' &&
								requirements.roundCount > 0
									? { roundCount: requirements.roundCount }
									: {}),
							},
						}
					: {}),
				...(galleryPaths.length > 0 ? { gallery: galleryPaths } : {}),
				...(trimmedVideo ? { sessionVideoUrl: trimmedVideo } : {}),
				visibleInParticipantPanel,
			};
			await onSubmit(data);
		} finally {
			setSubmitting(false);
		}
	};

	const roundCountValue =
		typeof requirements.roundCount === 'number' && requirements.roundCount > 0
			? String(requirements.roundCount)
			: '';

	return (
		<Paper variant='outlined' sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 4 }}>
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
				<SectionTitle>Nagłówek strony</SectionTitle>
				<TextField
					label='Eyebrow (etykieta nad tytułem)'
					value={eyebrow}
					onChange={(e) => setEyebrow(e.target.value)}
				/>
				<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
					<TextField
						label='Headline — linia 1'
						value={headline0}
						onChange={(e) => setHeadline0(e.target.value)}
					/>
					<TextField
						label='Headline — linia 2'
						value={headline1}
						onChange={(e) => setHeadline1(e.target.value)}
					/>
				</Box>
				<TextField
					label='Opis (lead)'
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					multiline
					minRows={3}
				/>
			</Box>

			<Divider />
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
				<SectionTitle>Wymagania</SectionTitle>
				<Typography variant='body2' color='text.secondary'>
					Szybki skan na stronie szkolenia: własna broń, kabura, liczba naboi.
				</Typography>
				<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
					<FormControlLabel
						control={
							<Checkbox
								checked={requirements.ownGun}
								onChange={(e) =>
									setRequirements((prev) => ({ ...prev, ownGun: e.target.checked }))
								}
							/>
						}
						label='Własna broń'
					/>
					<FormControlLabel
						control={
							<Checkbox
								checked={requirements.holster}
								onChange={(e) =>
									setRequirements((prev) => ({ ...prev, holster: e.target.checked }))
								}
							/>
						}
						label='Kabura'
					/>
					<TextField
						label='Amunicja (szt.)'
						type='number'
						size='small'
						value={roundCountValue}
						onChange={(e) => {
							const raw = e.target.value.trim();
							if (!raw) {
								setRequirements((prev) => {
									const { roundCount: _, ...rest } = prev;
									return rest;
								});
								return;
							}
							const n = Number.parseInt(raw, 10);
							if (!Number.isFinite(n) || n <= 0) return;
							setRequirements((prev) => ({ ...prev, roundCount: n }));
						}}
						slotProps={{ htmlInput: { min: 1, step: 1 } }}
						sx={{ width: 160 }}
					/>
				</Box>
			</Box>

			<Divider />
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
				<SectionTitleWithCheckbox
					title='Program zajęć (moduły)'
					sectionKey='modules'
					checked={visibleInParticipantPanel.includes('modules')}
					onToggle={togglePanelSection}
				/>
				<ModulesEditor value={modules} onChange={setModules} />
			</Box>

			<Divider />
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
				<SectionTitleWithCheckbox
					title='Dla kogo'
					sectionKey='forWhom'
					checked={visibleInParticipantPanel.includes('forWhom')}
					onToggle={togglePanelSection}
				/>
				<ListSectionEditor label='Kto powinien przyjść' value={forWhom} onChange={setForWhom} />
			</Box>

			<Divider />
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
				<SectionTitleWithCheckbox
					title='Czego nie będzie'
					sectionKey='notExpect'
					checked={visibleInParticipantPanel.includes('notExpect')}
					onToggle={togglePanelSection}
				/>
				<ListSectionEditor
					label='Czego się nie spodziewaj'
					value={notExpect}
					onChange={setNotExpect}
				/>
			</Box>

			<Divider />
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
				<SectionTitleWithCheckbox
					title='Co będziesz umiał'
					sectionKey='outcomes'
					checked={visibleInParticipantPanel.includes('outcomes')}
					onToggle={togglePanelSection}
				/>
				<ListSectionEditor
					label='Efekty po szkoleniu'
					value={outcomes}
					onChange={setOutcomes}
				/>
			</Box>

			<Divider />
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
				<SectionTitleWithCheckbox
					title='Co zabrać'
					sectionKey='bring'
					checked={visibleInParticipantPanel.includes('bring')}
					onToggle={togglePanelSection}
				/>
				<ListSectionEditor label='Wyposażenie' value={bring} onChange={setBring} />
			</Box>

			<Divider />
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
				<SectionTitleWithCheckbox
					title='Czego nie zabierać'
					sectionKey='dontBring'
					checked={visibleInParticipantPanel.includes('dontBring')}
					onToggle={togglePanelSection}
				/>
				<ListSectionEditor label='Zostaw w domu' value={dontBring} onChange={setDontBring} />
			</Box>

			<Divider />
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
				<SectionTitle>Z zajęć</SectionTitle>
				<CourseSessionMediaFields
					gallery={gallery}
					onGalleryChange={setGallery}
					sessionVideoUrl={sessionVideoUrl}
					onSessionVideoUrlChange={(url) => {
						setSessionVideoUrl(url);
						if (videoError) setVideoError(undefined);
					}}
					videoError={videoError}
				/>
			</Box>

			<Divider />
			{!defaultValues ? (
				<Typography variant='caption' color='text.secondary'>
					Nowy opis dla slugu /{slug}
				</Typography>
			) : null}
			<AdminStickyActions justifyContent='flex-end'>
				<Button variant='contained' onClick={handleSubmit} disabled={submitting}>
					{submitting ? 'Zapisywanie...' : 'ZAPISZ OPIS'}
				</Button>
			</AdminStickyActions>
		</Paper>
	);
};
