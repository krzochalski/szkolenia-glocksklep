'use client';

import {
	createFaqItem,
	deleteFaqItem,
	getFaqItems,
	updateFaqItem,
} from '@services/faq';
import type { FaqItem } from '@/types/faq';
import { Box, Button, Checkbox, CircularProgress, ConfirmDialog, Stack, Typography } from '@ui';
import { Delete } from '@ui/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { AdminFaqList } from './AdminFaqList';
import { AdminGate } from './AdminGate';
import {
	AdminFaqDialog,
	emptyFaqForm,
	type FaqFormData,
	FAQ_CATEGORY_OPTIONS,
} from './forms/AdminFaqDialog';

export const AdminFaqView = () => (
	<AdminGate>
		<FaqInner />
	</AdminGate>
);

const toForm = (item: FaqItem): FaqFormData => ({
	question: item.question,
	answer: item.answer,
	linkHref: item.link?.href ?? '',
	linkLabel: item.link?.label ?? '',
	category: item.category ?? 'rekrutacja',
});

const fromForm = (data: FaqFormData, order: number): Omit<FaqItem, 'id'> => ({
	question: data.question.trim(),
	answer: data.answer.trim(),
	order,
	category: data.category,
	...(data.linkHref.trim() && data.linkLabel.trim()
		? { link: { href: data.linkHref.trim(), label: data.linkLabel.trim() } }
		: {}),
});

const FaqInner = () => {
	const queryClient = useQueryClient();
	const { data: items = [], isLoading } = useQuery({
		queryKey: ['faq'],
		queryFn: getFaqItems,
	});
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editing, setEditing] = useState<FaqItem | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<FaqItem | null>(null);
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

	const invalidate = async () => {
		await queryClient.invalidateQueries({ queryKey: ['faq'] });
	};

	const groupedItems = useMemo(() => {
		const groups: Record<string, FaqItem[]> = {};
		for (const cat of FAQ_CATEGORY_OPTIONS) {
			groups[cat.value] = [];
		}
		for (const item of items) {
			const category = item.category ?? 'rekrutacja';
			if (groups[category]) groups[category].push(item);
			else groups.rekrutacja.push(item);
		}
		return groups;
	}, [items]);

	const toggleSelect = (id: string) => {
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const toggleSelectAll = () => {
		if (selected.size === items.length) setSelected(new Set());
		else setSelected(new Set(items.map((i) => i.id)));
	};

	const removeOne = useMutation({
		mutationFn: async () => {
			if (!deleteTarget) throw new Error('Brak pytania');
			await deleteFaqItem(deleteTarget.id);
		},
		onSuccess: async () => {
			setDeleteTarget(null);
			await invalidate();
		},
	});

	const removeBulk = useMutation({
		mutationFn: async () => {
			await Promise.all([...selected].map((id) => deleteFaqItem(id)));
		},
		onSuccess: async () => {
			setSelected(new Set());
			setBulkDeleteOpen(false);
			await invalidate();
		},
	});

	const handleMove = async (item: FaqItem, direction: 'up' | 'down', categoryItems: FaqItem[]) => {
		const idx = categoryItems.findIndex((i) => i.id === item.id);
		const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
		if (swapIdx < 0 || swapIdx >= categoryItems.length) return;
		const other = categoryItems[swapIdx];
		await Promise.all([
			updateFaqItem(item.id, { order: other.order }),
			updateFaqItem(other.id, { order: item.order }),
		]);
		await invalidate();
	};

	if (isLoading) return <CircularProgress />;

	const maxOrderForCreate = (category: string) =>
		(groupedItems[category] ?? []).reduce((max, item) => Math.max(max, item.order), 0);

	return (
		<Box>
			<Stack
				direction='row'
				sx={{ mb: 3, alignItems: 'center', justifyContent: 'space-between' }}
			>
				<Typography variant='h5'>FAQ</Typography>
				<Button
					variant='contained'
					onClick={() => {
						setEditing(null);
						setDialogOpen(true);
					}}
				>
					Dodaj
				</Button>
			</Stack>

			<AdminFaqDialog
				open={dialogOpen}
				title={editing ? 'Edytuj pytanie' : 'Nowe pytanie'}
				initial={editing ? toForm(editing) : emptyFaqForm}
				onClose={() => setDialogOpen(false)}
				onSubmit={async (data) => {
					if (editing) {
						await updateFaqItem(editing.id, fromForm(data, editing.order));
					} else {
						await createFaqItem(fromForm(data, maxOrderForCreate(data.category) + 1));
					}
					await invalidate();
				}}
			/>

			{items.length === 0 ? (
				<Typography color='text.secondary'>Brak pytań FAQ.</Typography>
			) : (
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
						<Checkbox
							size='small'
							checked={items.length > 0 && selected.size === items.length}
							indeterminate={selected.size > 0 && selected.size < items.length}
							onChange={toggleSelectAll}
							slotProps={{ input: { 'aria-label': 'Zaznacz wszystkie' } }}
						/>
						<Typography variant='body2' color='text.secondary'>
							{selected.size > 0
								? `Zaznaczono ${selected.size} z ${items.length}`
								: 'Zaznacz wszystkie'}
						</Typography>
						{selected.size > 0 ? (
							<Button
								size='small'
								variant='outlined'
								color='error'
								startIcon={<Delete />}
								onClick={() => setBulkDeleteOpen(true)}
							>
								Usuń zaznaczone ({selected.size})
							</Button>
						) : null}
					</Box>

					<AdminFaqList
						groupedItems={groupedItems}
						selected={selected}
						onToggleSelect={toggleSelect}
						onEdit={(item) => {
							setEditing(item);
							setDialogOpen(true);
						}}
						onDelete={setDeleteTarget}
						onMove={handleMove}
					/>
				</Box>
			)}

			<ConfirmDialog
				open={Boolean(deleteTarget)}
				title='Potwierdź usunięcie'
				cancelLabel='Anuluj'
				confirmLabel='Usuń'
				loading={removeOne.isPending}
				onCancel={() => setDeleteTarget(null)}
				onConfirm={() => removeOne.mutate()}
			>
				<Typography>
					Czy na pewno chcesz usunąć pytanie: <strong>{deleteTarget?.question}</strong>?
				</Typography>
			</ConfirmDialog>

			<ConfirmDialog
				open={bulkDeleteOpen}
				title='Potwierdź usunięcie'
				cancelLabel='Anuluj'
				confirmLabel='Usuń wszystkie'
				loading={removeBulk.isPending}
				onCancel={() => setBulkDeleteOpen(false)}
				onConfirm={() => removeBulk.mutate()}
			>
				<Typography>
					Czy na pewno chcesz usunąć <strong>{selected.size}</strong> zaznaczonych pytań? Tej
					operacji nie można cofnąć.
				</Typography>
			</ConfirmDialog>
		</Box>
	);
};
