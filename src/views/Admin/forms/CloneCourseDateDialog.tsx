'use client';

import { ConfirmDialog, Stack, TextField, Typography } from '@ui';
import { useEffect, useState } from 'react';

type Props = {
	readonly open: boolean;
	readonly sourceDateLabel: string;
	readonly courseName?: string;
	readonly loading?: boolean;
	readonly onCancel: () => void;
	readonly onConfirm: (newDate: string) => void;
};

const isYmd = (value: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(value);

export const CloneCourseDateDialog = ({
	open,
	sourceDateLabel,
	courseName,
	loading = false,
	onCancel,
	onConfirm,
}: Props) => {
	const [newDate, setNewDate] = useState('');
	const [touched, setTouched] = useState(false);

	useEffect(() => {
		if (!open) {
			setNewDate('');
			setTouched(false);
		}
	}, [open]);

	const showError = touched && !isYmd(newDate);

	return (
		<ConfirmDialog
			open={open}
			title='Potwierdź klonowanie terminu'
			cancelLabel='Anuluj'
			confirmLabel='Klonuj'
			confirmColor='primary'
			loading={loading}
			onCancel={onCancel}
			onConfirm={() => {
				setTouched(true);
				if (!isYmd(newDate)) return;
				onConfirm(newDate);
			}}
		>
			<Stack spacing={2}>
				<Typography>
					Sklonuj termin <strong>{sourceDateLabel}</strong>
					{courseName ? (
						<>
							{' '}
							(<strong>{courseName}</strong>)
						</>
					) : null}
					. Ustaw nową datę — bez niej klon zachowałby starą datę i nie trafiłby do
					„Najbliższe szkolenia”.
				</Typography>
				<TextField
					label='Nowa data'
					type='date'
					fullWidth
					size='small'
					value={newDate}
					onChange={(e) => setNewDate(e.target.value)}
					onBlur={() => setTouched(true)}
					error={showError}
					helperText={showError ? 'Podaj datę w formacie RRRR-MM-DD' : ' '}
					slotProps={{ inputLabel: { shrink: true } }}
					required
				/>
			</Stack>
		</ConfirmDialog>
	);
};
