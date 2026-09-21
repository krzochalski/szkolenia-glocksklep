'use client';

import type { FaqItem } from '@/types/faq';
import { Box, Checkbox, IconButton, Paper, Tooltip, Typography } from '@ui';
import { ArrowDownward, ArrowUpward, Delete, Edit } from '@ui/icons';
import { FAQ_CATEGORY_OPTIONS } from './forms/AdminFaqDialog';

type AdminFaqListProps = {
	readonly groupedItems: Record<string, FaqItem[]>;
	readonly selected: Set<string>;
	readonly onToggleSelect: (id: string) => void;
	readonly onEdit: (item: FaqItem) => void;
	readonly onDelete: (item: FaqItem) => void;
	readonly onMove: (item: FaqItem, direction: 'up' | 'down', categoryItems: FaqItem[]) => void;
};

export const AdminFaqList = ({
	groupedItems,
	selected,
	onToggleSelect,
	onEdit,
	onDelete,
	onMove,
}: AdminFaqListProps) => (
	<>
		{FAQ_CATEGORY_OPTIONS.map((cat) => {
			const catItems = groupedItems[cat.value];
			if (!catItems || catItems.length === 0) return null;

			return (
				<Box key={cat.value} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
					<Typography
						variant='caption'
						sx={{
							color: 'primary.main',
							fontWeight: 700,
							letterSpacing: '0.1em',
							pb: 1,
							borderBottom: '1px solid',
							borderColor: 'divider',
						}}
					>
						{cat.label} ({catItems.length})
					</Typography>

					{catItems.map((item, idx) => (
						<Paper
							key={item.id}
							variant='outlined'
							sx={{ p: 2, display: 'flex', alignItems: 'flex-start', gap: 2 }}
						>
							<Checkbox
								size='small'
								checked={selected.has(item.id)}
								onChange={() => onToggleSelect(item.id)}
								sx={{ mt: 0.5 }}
								slotProps={{ input: { 'aria-label': `Zaznacz: ${item.question}` } }}
							/>
							<Box sx={{ display: 'flex', flexDirection: 'column' }}>
								<IconButton
									size='small'
									disabled={idx === 0}
									onClick={() => onMove(item, 'up', catItems)}
									aria-label='Przenieś w górę'
								>
									<ArrowUpward fontSize='small' />
								</IconButton>
								<IconButton
									size='small'
									disabled={idx === catItems.length - 1}
									onClick={() => onMove(item, 'down', catItems)}
									aria-label='Przenieś w dół'
								>
									<ArrowDownward fontSize='small' />
								</IconButton>
							</Box>
							<Box sx={{ flex: 1, minWidth: 0 }}>
								<Typography sx={{ fontWeight: 700, mb: 0.5 }}>
									{item.question}
								</Typography>
								<Typography variant='body2' color='text.secondary' sx={{ whiteSpace: 'pre-wrap' }}>
									{item.answer}
								</Typography>
								{item.link ? (
									<Typography variant='caption' color='primary.main' sx={{ mt: 0.5, display: 'block' }}>
										{item.link.label} — {item.link.href}
									</Typography>
								) : null}
							</Box>
							<Box sx={{ display: 'flex', gap: 0.5 }}>
								<Tooltip title='Edytuj'>
									<IconButton size='small' onClick={() => onEdit(item)} aria-label='Edytuj pytanie'>
										<Edit fontSize='small' />
									</IconButton>
								</Tooltip>
								<Tooltip title='Usuń'>
									<IconButton
										size='small'
										onClick={() => onDelete(item)}
										aria-label='Usuń pytanie'
										color='error'
									>
										<Delete fontSize='small' />
									</IconButton>
								</Tooltip>
							</Box>
						</Paper>
					))}
				</Box>
			);
		})}
	</>
);
