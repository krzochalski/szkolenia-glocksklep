'use client';

import {
	Box,
	Button,
	Checkbox,
	ConfirmDialog,
	IconButton,
	TextField,
	Tooltip,
	Typography,
} from '@ui';
import { Add, Delete } from '@ui/icons';
import { useState } from 'react';
import type {
	CourseDescriptionSection,
	CourseDescriptionSectionKey,
	CourseModuleData,
} from '@/types/courseDescription';
import { SectionTitle } from './SectionTitle';

type SectionTitleWithCheckboxProps = {
	readonly title: string;
	readonly sectionKey: CourseDescriptionSectionKey;
	readonly checked: boolean;
	readonly onToggle: (key: CourseDescriptionSectionKey) => void;
};

export const SectionTitleWithCheckbox = ({
	title,
	sectionKey,
	checked,
	onToggle,
}: SectionTitleWithCheckboxProps) => (
	<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
		<SectionTitle>{title}</SectionTitle>
		<Tooltip title={checked ? 'Widoczne w panelu uczestnika' : 'Ukryte w panelu uczestnika'}>
			<Checkbox
				size='small'
				checked={checked}
				onChange={() => onToggle(sectionKey)}
				sx={{ ml: 'auto' }}
			/>
		</Tooltip>
		<Typography
			variant='caption'
			color={checked ? 'success.main' : 'text.disabled'}
			sx={{ whiteSpace: 'nowrap' }}
		>
			{checked ? 'Widoczne' : 'Ukryte'}
		</Typography>
	</Box>
);

type ListSectionEditorProps = {
	readonly label: string;
	readonly value: CourseDescriptionSection;
	readonly onChange: (val: CourseDescriptionSection) => void;
};

export const ListSectionEditor = ({ label, value, onChange }: ListSectionEditorProps) => {
	const [toRemoveIndex, setToRemoveIndex] = useState<number | null>(null);
	const addItem = () => onChange({ ...value, items: [...value.items, ''] });
	const removeItem = (idx: number) =>
		onChange({ ...value, items: value.items.filter((_, i) => i !== idx) });
	const updateItem = (idx: number, text: string) =>
		onChange({ ...value, items: value.items.map((item, i) => (i === idx ? text : item)) });

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
			<Typography variant='body2' color='text.secondary'>
				{label}
			</Typography>
			<TextField
				size='small'
				label='Nagłówek sekcji (opcjonalny)'
				value={value.heading ?? ''}
				onChange={(e) => onChange({ ...value, heading: e.target.value || undefined })}
			/>
			{value.items.map((item, idx) => (
				<Box
					// biome-ignore lint/suspicious/noArrayIndexKey: dynamic form list items
					key={idx}
					sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}
				>
					<TextField
						size='small'
						fullWidth
						multiline
						value={item}
						onChange={(e) => updateItem(idx, e.target.value)}
						placeholder={`Element ${idx + 1}`}
					/>
					<Tooltip title='Usuń'>
						<IconButton size='small' onClick={() => setToRemoveIndex(idx)} aria-label='Usuń'>
							<Delete fontSize='small' />
						</IconButton>
					</Tooltip>
				</Box>
			))}
			<Button size='small' startIcon={<Add />} onClick={addItem} sx={{ alignSelf: 'flex-start' }}>
				Dodaj element
			</Button>
			<ConfirmDialog
				open={toRemoveIndex !== null}
				title='Potwierdź usunięcie'
				cancelLabel='Anuluj'
				confirmLabel='Usuń'
				onCancel={() => setToRemoveIndex(null)}
				onConfirm={() => {
					if (toRemoveIndex !== null) removeItem(toRemoveIndex);
					setToRemoveIndex(null);
				}}
			>
				<Typography>Czy na pewno chcesz usunąć ten element?</Typography>
			</ConfirmDialog>
		</Box>
	);
};

type ModulesEditorProps = {
	readonly value: CourseModuleData[];
	readonly onChange: (val: CourseModuleData[]) => void;
};

export const ModulesEditor = ({ value, onChange }: ModulesEditorProps) => {
	const [toRemoveIndex, setToRemoveIndex] = useState<number | null>(null);
	const addModule = () => onChange([...value, { icon: 'GpsFixed', title: '', desc: '' }]);
	const removeModule = (idx: number) => onChange(value.filter((_, i) => i !== idx));
	const updateModule = (idx: number, field: keyof CourseModuleData, val: string) =>
		onChange(value.map((m, i) => (i === idx ? { ...m, [field]: val } : m)));

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
			{value.map((mod, idx) => (
				<Box
					// biome-ignore lint/suspicious/noArrayIndexKey: dynamic form list items
					key={idx}
					sx={{
						display: 'grid',
						gridTemplateColumns: { xs: '1fr', md: '120px 1fr 2fr auto' },
						gap: 1,
					}}
				>
					<TextField
						size='small'
						value={mod.icon}
						onChange={(e) => updateModule(idx, 'icon', e.target.value)}
						placeholder='Ikona'
						label='Ikona'
					/>
					<TextField
						size='small'
						value={mod.title}
						onChange={(e) => updateModule(idx, 'title', e.target.value)}
						placeholder='Tytuł modułu'
					/>
					<TextField
						size='small'
						value={mod.desc}
						onChange={(e) => updateModule(idx, 'desc', e.target.value)}
						placeholder='Opis modułu'
					/>
					<Tooltip title='Usuń'>
						<IconButton size='small' onClick={() => setToRemoveIndex(idx)} aria-label='Usuń'>
							<Delete fontSize='small' />
						</IconButton>
					</Tooltip>
				</Box>
			))}
			<Button size='small' startIcon={<Add />} onClick={addModule} sx={{ alignSelf: 'flex-start' }}>
				Dodaj moduł
			</Button>
			<ConfirmDialog
				open={toRemoveIndex !== null}
				title='Potwierdź usunięcie'
				cancelLabel='Anuluj'
				confirmLabel='Usuń'
				onCancel={() => setToRemoveIndex(null)}
				onConfirm={() => {
					if (toRemoveIndex !== null) removeModule(toRemoveIndex);
					setToRemoveIndex(null);
				}}
			>
				<Typography>Czy na pewno chcesz usunąć ten moduł?</Typography>
			</ConfirmDialog>
		</Box>
	);
};
