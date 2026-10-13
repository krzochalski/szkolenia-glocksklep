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
import {
	Autocomplete,
	Box,
	Button,
	Checkbox,
	ConfirmDialog,
	IconButton,
	TextField,
	Tooltip,
	Typography,
} from '@ui';
import { Add, Delete, DragHandle } from '@ui/icons';
import { useState } from 'react';
import type {
	CourseDescriptionSection,
	CourseDescriptionSectionKey,
	CourseModuleData,
} from '@/types/courseDescription';
import { COURSE_ICON_NAMES, getCourseIcon } from '@/utils/courseIcons';
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

const useListSensors = () =>
	useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

type ListSectionEditorProps = {
	readonly label: string;
	readonly value: CourseDescriptionSection;
	readonly onChange: (val: CourseDescriptionSection) => void;
};

type SortableListItemProps = {
	readonly id: string;
	readonly index: number;
	readonly text: string;
	readonly onChangeText: (text: string) => void;
	readonly onRemove: () => void;
};

const SortableListItem = ({ id, index, text, onChangeText, onRemove }: SortableListItemProps) => {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id,
	});

	return (
		<Box
			ref={setNodeRef}
			sx={{
				display: 'flex',
				gap: 1,
				alignItems: 'flex-start',
				transform: CSS.Transform.toString(transform),
				transition,
				opacity: isDragging ? 0.6 : 1,
			}}
		>
			<Tooltip title='Przeciągnij, aby zmienić kolejność'>
				<IconButton
					size='small'
					{...attributes}
					{...listeners}
					aria-label={`Przenieś element ${index + 1}`}
					sx={{ cursor: 'grab', touchAction: 'none', mt: 0.5 }}
				>
					<DragHandle fontSize='small' />
				</IconButton>
			</Tooltip>
			<TextField
				size='small'
				fullWidth
				multiline
				value={text}
				onChange={(e) => onChangeText(e.target.value)}
				placeholder={`Element ${index + 1}`}
			/>
			<Tooltip title='Usuń'>
				<IconButton size='small' onClick={onRemove} aria-label='Usuń' sx={{ mt: 0.5 }}>
					<Delete fontSize='small' />
				</IconButton>
			</Tooltip>
		</Box>
	);
};

export const ListSectionEditor = ({ label, value, onChange }: ListSectionEditorProps) => {
	const [toRemoveIndex, setToRemoveIndex] = useState<number | null>(null);
	const sensors = useListSensors();
	const itemIds = value.items.map((_, idx) => String(idx));

	const addItem = () => onChange({ ...value, items: [...value.items, ''] });
	const removeItem = (idx: number) =>
		onChange({ ...value, items: value.items.filter((_, i) => i !== idx) });
	const updateItem = (idx: number, text: string) =>
		onChange({ ...value, items: value.items.map((item, i) => (i === idx ? text : item)) });

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (!over || active.id === over.id) return;
		const oldIndex = Number(active.id);
		const newIndex = Number(over.id);
		if (Number.isNaN(oldIndex) || Number.isNaN(newIndex)) return;
		onChange({ ...value, items: arrayMove(value.items, oldIndex, newIndex) });
	};

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
			{value.items.length === 0 ? null : (
				<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
					<SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
							{value.items.map((item, idx) => (
								<SortableListItem
									key={itemIds[idx]}
									id={itemIds[idx] ?? String(idx)}
									index={idx}
									text={item}
									onChangeText={(text) => updateItem(idx, text)}
									onRemove={() => setToRemoveIndex(idx)}
								/>
							))}
						</Box>
					</SortableContext>
				</DndContext>
			)}
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

type SortableModuleRowProps = {
	readonly id: string;
	readonly index: number;
	readonly mod: CourseModuleData;
	readonly onUpdate: (field: keyof CourseModuleData, val: string) => void;
	readonly onRemove: () => void;
};

const SortableModuleRow = ({ id, index, mod, onUpdate, onRemove }: SortableModuleRowProps) => {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id,
	});
	const iconOptions =
		mod.icon && !COURSE_ICON_NAMES.includes(mod.icon)
			? [mod.icon, ...COURSE_ICON_NAMES]
			: COURSE_ICON_NAMES;
	const iconValue = mod.icon || null;

	return (
		<Box
			ref={setNodeRef}
			sx={{
				display: 'grid',
				gridTemplateColumns: { xs: 'auto 1fr', md: 'auto 200px 1fr 2fr auto' },
				gap: 1,
				alignItems: 'flex-start',
				transform: CSS.Transform.toString(transform),
				transition,
				opacity: isDragging ? 0.6 : 1,
				p: 1.25,
				border: '2px solid',
				borderColor: 'ink.main',
				bgcolor: 'background.paper',
			}}
		>
			<Tooltip title='Przeciągnij, aby zmienić kolejność'>
				<IconButton
					size='small'
					{...attributes}
					{...listeners}
					aria-label={`Przenieś moduł ${index + 1}`}
					sx={{ cursor: 'grab', touchAction: 'none', mt: 0.5 }}
				>
					<DragHandle fontSize='small' />
				</IconButton>
			</Tooltip>
			<Autocomplete
				options={iconOptions}
				value={iconValue}
				onChange={(_, next) => onUpdate('icon', next ?? 'GpsFixed')}
				getOptionLabel={(option) => option}
				isOptionEqualToValue={(option, val) => option === val}
				renderOption={(props, option) => {
					const { key, ...rest } = props as typeof props & { key?: string };
					return (
						<Box
							component='li'
							key={key ?? option}
							{...rest}
							sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}
						>
							<Box sx={{ color: 'primary.main', display: 'flex' }}>{getCourseIcon(option)}</Box>
							{option}
						</Box>
					);
				}}
				renderInput={(params) => (
					<TextField
						{...params}
						size='small'
						label='Ikona'
						slotProps={{
							...params.slotProps,
							input: {
								...params.slotProps.input,
								startAdornment: (
									<>
										<Box sx={{ color: 'primary.main', display: 'flex', ml: 0.5, mr: 0.5 }}>
											{getCourseIcon(mod.icon || 'GpsFixed')}
										</Box>
										{params.slotProps.input.startAdornment}
									</>
								),
							},
						}}
					/>
				)}
			/>
			<TextField
				size='small'
				value={mod.title}
				onChange={(e) => onUpdate('title', e.target.value)}
				placeholder='Tytuł modułu'
				label='Tytuł'
			/>
			<TextField
				size='small'
				value={mod.desc}
				onChange={(e) => onUpdate('desc', e.target.value)}
				placeholder='Opis modułu'
				label='Opis'
			/>
			<Tooltip title='Usuń'>
				<IconButton size='small' onClick={onRemove} aria-label='Usuń' sx={{ mt: 0.5 }}>
					<Delete fontSize='small' />
				</IconButton>
			</Tooltip>
		</Box>
	);
};

export const ModulesEditor = ({ value, onChange }: ModulesEditorProps) => {
	const [toRemoveIndex, setToRemoveIndex] = useState<number | null>(null);
	const sensors = useListSensors();
	const itemIds = value.map((_, idx) => String(idx));

	const addModule = () => onChange([...value, { icon: 'GpsFixed', title: '', desc: '' }]);
	const removeModule = (idx: number) => onChange(value.filter((_, i) => i !== idx));
	const updateModule = (idx: number, field: keyof CourseModuleData, val: string) =>
		onChange(value.map((m, i) => (i === idx ? { ...m, [field]: val } : m)));

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (!over || active.id === over.id) return;
		const oldIndex = Number(active.id);
		const newIndex = Number(over.id);
		if (Number.isNaN(oldIndex) || Number.isNaN(newIndex)) return;
		onChange(arrayMove(value, oldIndex, newIndex));
	};

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
			{value.length === 0 ? null : (
				<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
					<SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
							{value.map((mod, idx) => (
								<SortableModuleRow
									key={itemIds[idx]}
									id={itemIds[idx] ?? String(idx)}
									index={idx}
									mod={mod}
									onUpdate={(field, val) => updateModule(idx, field, val)}
									onRemove={() => setToRemoveIndex(idx)}
								/>
							))}
						</Box>
					</SortableContext>
				</DndContext>
			)}
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
