'use client';

import type {
	CourseDescription,
	CourseDescriptionSection,
	CourseDescriptionSectionKey,
	CourseModuleData,
} from '@/types/courseDescription';
import { Box, Button, Divider, Paper, TextField, Typography } from '@ui';
import { useState } from 'react';
import {
	ListSectionEditor,
	ModulesEditor,
	SectionTitleWithCheckbox,
} from './CourseDescriptionFormEditors';
import { SectionTitle } from './SectionTitle';

type CourseDescriptionFormProps = {
	readonly slug: string;
	readonly defaultValues: CourseDescription | null;
	readonly onSubmit: (data: Omit<CourseDescription, 'id'>) => Promise<void>;
};

const emptySection = (): CourseDescriptionSection => ({ items: [] });

export const CourseDescriptionForm = ({
	slug,
	defaultValues,
	onSubmit,
}: CourseDescriptionFormProps) => {
	const [eyebrow, setEyebrow] = useState(defaultValues?.eyebrow ?? '');
	const [headline0, setHeadline0] = useState(defaultValues?.headline?.[0] ?? '');
	const [headline1, setHeadline1] = useState(defaultValues?.headline?.[1] ?? '');
	const [description, setDescription] = useState(defaultValues?.description ?? '');
	const [background, setBackground] = useState(defaultValues?.background ?? '');
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
		setSubmitting(true);
		try {
			const data: Omit<CourseDescription, 'id'> = {
				slug,
				eyebrow,
				headline: [headline0, headline1],
				description,
				...(background ? { background } : {}),
				...(modules.length > 0 ? { modules } : {}),
				...(forWhom.items.length > 0 ? { forWhom } : {}),
				...(notExpect.items.length > 0 ? { notExpect } : {}),
				...(bring.items.length > 0 ? { bring } : {}),
				...(dontBring.items.length > 0 ? { dontBring } : {}),
				visibleInParticipantPanel,
			};
			await onSubmit(data);
		} finally {
			setSubmitting(false);
		}
	};

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
				<TextField
					label='Ścieżka tła (opcjonalna)'
					value={background}
					onChange={(e) => setBackground(e.target.value)}
					placeholder='/hero/...'
				/>
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
			<Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
				<Button variant='contained' onClick={handleSubmit} disabled={submitting}>
					{submitting ? 'Zapisywanie...' : 'ZAPISZ OPIS'}
				</Button>
			</Box>
			{!defaultValues ? (
				<Typography variant='caption' color='text.secondary'>
					Nowy opis dla slugu /{slug}
				</Typography>
			) : null}
		</Paper>
	);
};
