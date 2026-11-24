'use client';

import { adminIconButtonTouchSx } from '@components/adminResponsive';
import type { CourseClass } from '@/types/course';
import { IconButton, Stack, Tooltip } from '@ui';
import { Block, ContentCopy, Delete, Edit, EventAvailable } from '@ui/icons';
import NextLink from 'next/link';

type AdminDateRowActionsProps = {
	readonly date: CourseClass;
	readonly editHref: string;
	readonly pending?: boolean;
	readonly onClone: () => void;
	readonly onCancel: () => void;
	readonly onUncancel: () => void;
	readonly onDelete: () => void;
};

export const AdminDateRowActions = ({
	date,
	editHref,
	pending = false,
	onClone,
	onCancel,
	onUncancel,
	onDelete,
}: AdminDateRowActionsProps) => (
	<Stack
		direction='row'
		spacing={0.25}
		sx={{ flexShrink: 0, flexWrap: 'wrap', gap: 0.5 }}
	>
		<Tooltip title='Klonuj'>
			<IconButton
				size='small'
				disabled={pending}
				onClick={onClone}
				aria-label='Klonuj termin'
				sx={adminIconButtonTouchSx}
			>
				<ContentCopy fontSize='small' />
			</IconButton>
		</Tooltip>
		<Tooltip title='Edytuj'>
			<IconButton
				size='small'
				component={NextLink}
				href={editHref}
				disabled={pending}
				aria-label='Edytuj termin'
				sx={adminIconButtonTouchSx}
			>
				<Edit fontSize='small' />
			</IconButton>
		</Tooltip>
		{date.canceled ? (
			<Tooltip title='Przywróć'>
				<IconButton
					size='small'
					disabled={pending}
					onClick={onUncancel}
					aria-label='Przywróć termin'
					color='success'
					sx={adminIconButtonTouchSx}
				>
					<EventAvailable fontSize='small' />
				</IconButton>
			</Tooltip>
		) : (
			<Tooltip title='Odwołaj'>
				<IconButton
					size='small'
					disabled={pending}
					onClick={onCancel}
					aria-label='Odwołaj termin'
					color='warning'
					sx={adminIconButtonTouchSx}
				>
					<Block fontSize='small' />
				</IconButton>
			</Tooltip>
		)}
		<Tooltip title='Usuń'>
			<IconButton
				size='small'
				disabled={pending}
				onClick={onDelete}
				aria-label='Usuń termin'
				color='error'
				sx={adminIconButtonTouchSx}
			>
				<Delete fontSize='small' />
			</IconButton>
		</Tooltip>
	</Stack>
);
