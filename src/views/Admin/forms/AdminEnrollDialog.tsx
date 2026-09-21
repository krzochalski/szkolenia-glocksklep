'use client';

import { adminEnrollParticipant, getCourses } from '@services/courses';
import { adminGetUsers, type UserProfile } from '@services/users';
import type { Course } from '@/types/course';
import {
	Autocomplete,
	Box,
	Button,
	CircularProgress,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControlLabel,
	HardShadowDialog,
	hardShadowDialogActionsSx,
	hardShadowDialogContentSx,
	hardShadowDialogTitleSx,
	MenuItem,
	Switch,
	TextField,
	Typography,
} from '@ui';
import { PeopleIcon } from '@ui/icons';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

type Props = {
	readonly open: boolean;
	readonly onClose: () => void;
	readonly onEnrolled: () => void;
};

export const AdminEnrollDialog = ({ open, onClose, onEnrolled }: Props) => {
	const [courses, setCourses] = useState<Course[]>([]);
	const [users, setUsers] = useState<UserProfile[]>([]);
	const [loadingData, setLoadingData] = useState(false);
	const [selectedCourseId, setSelectedCourseId] = useState('');
	const [selectedDateId, setSelectedDateId] = useState('');
	const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [futureOnly, setFutureOnly] = useState(true);

	useEffect(() => {
		if (!open) return;
		setLoadingData(true);
		void Promise.all([getCourses(), adminGetUsers()])
			.then(([c, u]) => {
				setCourses(c);
				setUsers(u);
			})
			.finally(() => setLoadingData(false));
	}, [open]);

	const handleClose = () => {
		setSelectedCourseId('');
		setSelectedDateId('');
		setSelectedUser(null);
		setError(null);
		onClose();
	};

	const selectedCourse = courses.find((c) => c.id === selectedCourseId) ?? null;
	const selectedDate = selectedCourse?.dates?.find((d) => d.id === selectedDateId) ?? null;
	const alreadyEnrolled =
		selectedDate && selectedUser
			? selectedDate.participants.some((p) => p.id === selectedUser.uid)
			: false;
	const slotsLeft = selectedDate
		? selectedDate.slotsMax - (selectedDate.participants?.length ?? 0)
		: null;
	const canSubmit =
		Boolean(selectedCourseId) &&
		Boolean(selectedDateId) &&
		Boolean(selectedUser) &&
		!alreadyEnrolled &&
		!selectedDate?.canceled &&
		!submitting;

	const handleSubmit = async () => {
		if (!selectedUser || !selectedCourseId || !selectedDateId) return;
		setSubmitting(true);
		setError(null);
		try {
			await adminEnrollParticipant(selectedCourseId, selectedDateId, {
				id: selectedUser.uid,
				name: selectedUser.displayName ?? selectedUser.email,
				email: selectedUser.email,
				...(selectedUser.phoneNumber ? { phoneNumber: selectedUser.phoneNumber } : {}),
			});
			onEnrolled();
			handleClose();
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Błąd zapisu.');
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<HardShadowDialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
			<DialogTitle sx={[hardShadowDialogTitleSx, { justifyContent: 'flex-start', gap: 1 }]}>
				<PeopleIcon fontSize='small' />
				Zapisz uczestnika
			</DialogTitle>
			<DialogContent sx={[hardShadowDialogContentSx, { gap: 2 }]}>
				{loadingData ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
						<CircularProgress size={24} />
					</Box>
				) : (
					<>
						<Typography variant='body2' color='text.secondary'>
							Ręczne zapisanie uczestnika na szkolenie.
						</Typography>
						<Autocomplete
							options={users}
							getOptionLabel={(u) =>
								u.displayName ? `${u.displayName} (${u.email})` : u.email
							}
							value={selectedUser}
							onChange={(_, val) => setSelectedUser(val)}
							renderInput={(params) => <TextField {...params} label='Uczestnik' />}
							noOptionsText='Brak użytkowników'
						/>
						<TextField
							select
							label='Szkolenie'
							value={selectedCourseId}
							onChange={(e) => {
								setSelectedCourseId(e.target.value);
								setSelectedDateId('');
							}}
						>
							{courses.map((c) => (
								<MenuItem key={c.id} value={c.id}>
									{c.name}
								</MenuItem>
							))}
						</TextField>
						<TextField
							select
							label='Termin'
							value={selectedDateId}
							onChange={(e) => setSelectedDateId(e.target.value)}
							disabled={!selectedCourseId}
						>
							{(selectedCourse?.dates ?? [])
								.filter((d) => !futureOnly || !dayjs(d.date).isBefore(dayjs(), 'day'))
								.map((d) => {
									const taken = d.participants?.length ?? 0;
									const free = d.slotsMax - taken;
									const canceled = Boolean(d.canceled);
									return (
										<MenuItem key={d.id} value={d.id} disabled={free <= 0 || canceled}>
											{dayjs(d.date).format('DD.MM.YYYY')} {d.timeStart} — {d.place?.name}
											{canceled
												? ' (Anulowany)'
												: free <= 0
													? ' (Miejsca wyprzedane)'
													: ` (${free} miejsc)`}
										</MenuItem>
									);
								})}
						</TextField>
						<FormControlLabel
							control={
								<Switch
									checked={futureOnly}
									onChange={(_, checked) => {
										setFutureOnly(checked);
										setSelectedDateId('');
									}}
									size='small'
								/>
							}
							label='Tylko przyszłe terminy'
						/>
						{selectedDate ? (
							<Typography variant='body2' color={slotsLeft === 0 ? 'error' : 'text.secondary'}>
								{slotsLeft === 0
									? 'Brak wolnych miejsc na ten termin.'
									: `Wolne miejsca: ${slotsLeft} / ${selectedDate.slotsMax}`}
							</Typography>
						) : null}
						{alreadyEnrolled ? (
							<Typography variant='body2' color='warning.main'>
								Ten uczestnik jest już zapisany na ten termin.
							</Typography>
						) : null}
						{error ? (
							<Typography variant='body2' color='error'>
								{error}
							</Typography>
						) : null}
					</>
				)}
			</DialogContent>
			<DialogActions sx={hardShadowDialogActionsSx}>
				<Button onClick={handleClose} disabled={submitting}>
					Anuluj
				</Button>
				<Button variant='contained' onClick={handleSubmit} disabled={!canSubmit}>
					{submitting ? <CircularProgress size={14} /> : 'Zapisz'}
				</Button>
			</DialogActions>
		</HardShadowDialog>
	);
};
