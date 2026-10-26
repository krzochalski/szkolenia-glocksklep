'use client';

import {
	adminGetWaitingListEntries,
	adminNotifyWaitingList,
	adminRemoveFromWaitingList,
} from '@services/courseWaitingList';
import { getCourses } from '@services/courses';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	Box,
	Button,
	CircularProgress,
	Collapse,
	ConfirmDialog,
	ContentSwap,
	Divider,
	IconButton,
	MotionAlert,
	Stack,
	TextField,
	Typography,
} from '@ui';
import { ExpandMoreIcon } from '@ui/icons';
import { useMemo, useState } from 'react';
import type { CourseWaitingListEntry } from '@/types/courseWaitingList';
import {
	filterWaitingListEntries,
	groupWaitingListByCourse,
	type WaitingListCourseGroup,
} from '@/utils/adminWaitingListGroups';
import {
	WaitlistNotifyDialog,
	type WaitlistNotifyTarget,
} from './waitingList/WaitlistNotifyDialog';

export const AdminWaitingListView = () => <WaitingInner />;

type NotifyDraft = {
	target: WaitlistNotifyTarget;
	subject: string;
	body: string;
};

type SendResultMessage = {
	severity: 'success' | 'warning' | 'error';
	text: string;
};

const formatJoinedAt = (iso: string): string => {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	return d.toLocaleString('pl-PL');
};

const WaitingInner = () => {
	const queryClient = useQueryClient();
	const { data: entries = [], isLoading } = useQuery({
		queryKey: ['adminWaitingList'],
		queryFn: adminGetWaitingListEntries,
	});
	const { data: courses = [] } = useQuery({
		queryKey: ['courses'],
		queryFn: getCourses,
	});

	const lastEmailedByCourse = useMemo(() => {
		const map = new Map<string, string>();
		for (const c of courses) {
			if (c.waitingListLastEmailedAt) {
				map.set(c.id, c.waitingListLastEmailedAt);
			}
		}
		return map;
	}, [courses]);

	const [search, setSearch] = useState('');
	const [expanded, setExpanded] = useState<Record<string, boolean>>({});
	const [toDelete, setToDelete] = useState<CourseWaitingListEntry | null>(null);
	const [composeTarget, setComposeTarget] = useState<WaitlistNotifyTarget | null>(null);
	const [confirmDraft, setConfirmDraft] = useState<NotifyDraft | null>(null);
	const [resultMsg, setResultMsg] = useState<SendResultMessage | null>(null);

	const filtered = useMemo(
		() => filterWaitingListEntries(entries, search),
		[entries, search]
	);
	const groups = useMemo(() => groupWaitingListByCourse(filtered), [filtered]);

	const setAllExpanded = (value: boolean) => {
		const next: Record<string, boolean> = {};
		for (const g of groups) {
			next[g.courseId] = value;
		}
		setExpanded(next);
	};

	const isGroupOpen = (courseId: string) => expanded[courseId] !== false;

	const remove = useMutation({
		mutationFn: adminRemoveFromWaitingList,
		onSuccess: async () => {
			setToDelete(null);
			await queryClient.invalidateQueries({ queryKey: ['adminWaitingList'] });
		},
	});

	const notify = useMutation({
		mutationFn: adminNotifyWaitingList,
		onSuccess: async (result) => {
			setConfirmDraft(null);
			setComposeTarget(null);
			const parts = [
				`Wysłano: ${result.sent}`,
				`pominięto: ${result.skipped}`,
				`błąd: ${result.failed}`,
			];
			const severity =
				result.failed > 0 || result.skipped > 0
					? result.sent > 0
						? 'warning'
						: 'error'
					: 'success';
			setResultMsg({ severity, text: parts.join(' · ') });
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ['adminWaitingList'] }),
				queryClient.invalidateQueries({ queryKey: ['courses'] }),
			]);
		},
		onError: (err: Error) => {
			setResultMsg({
				severity: 'error',
				text: err.message || 'Nie udało się wysłać e-maili.',
			});
		},
	});

	return (
		<ContentSwap state={isLoading ? 'loading' : 'content'}>
			{isLoading ? (
				<CircularProgress />
			) : (
				<Box>
					<Stack
						direction={{ xs: 'column', sm: 'row' }}
						spacing={1}
						sx={{ mb: 1, alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
					>
						<Typography variant='h5'>Lista oczekujących</Typography>
						<Button
							variant='outlined'
							size='small'
							disabled={entries.length === 0}
							onClick={() =>
								setComposeTarget({
									scope: 'all',
									recipientCount: entries.length,
								})
							}
						>
							Wyślij e-mail do całej listy
						</Button>
					</Stack>

					<Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 1.5 }}>
						Kolejność: od najdawniej zapisanych (FIFO — sprawiedliwiej przy wolnym miejscu). Lista na
						poziomie kursu, nie pojedynczego terminu.
					</Typography>

					<MotionAlert
						show={Boolean(resultMsg)}
						severity={resultMsg?.severity ?? 'success'}
						sx={{ mb: 1.5 }}
						onClose={() => setResultMsg(null)}
					>
						{resultMsg?.text}
					</MotionAlert>

					{entries.length === 0 ? (
						<Typography color='text.secondary' sx={{ py: 4 }}>
							Lista pusta — nikt nie czeka na wolne miejsce ani nowy termin.
						</Typography>
					) : (
						<>
							<Stack
								direction={{ xs: 'column', sm: 'row' }}
								spacing={1}
								sx={{ mb: 2, alignItems: { sm: 'center' } }}
							>
								<TextField
									size='small'
									label='Szukaj (imię / e-mail)'
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									sx={{ flex: 1, maxWidth: 360 }}
								/>
								<Button
									size='small'
									variant='text'
									disabled={groups.length === 0}
									onClick={() => setAllExpanded(true)}
								>
									Rozwiń wszystkie
								</Button>
								<Button
									size='small'
									variant='text'
									disabled={groups.length === 0}
									onClick={() => setAllExpanded(false)}
								>
									Zwiń wszystkie
								</Button>
							</Stack>

							{groups.length === 0 ? (
								<Typography color='text.secondary' sx={{ py: 2 }}>
									Brak wyników dla „{search.trim()}”.
								</Typography>
							) : (
								<Stack spacing={1}>
									{groups.map((group) => (
										<WaitingListGroup
											key={group.courseId}
											group={group}
											open={isGroupOpen(group.courseId)}
											lastEmailedAt={lastEmailedByCourse.get(group.courseId)}
											onToggle={() =>
												setExpanded((prev) => ({
													...prev,
													[group.courseId]: !isGroupOpen(group.courseId),
												}))
											}
											onEmail={() =>
												setComposeTarget({
													scope: 'course',
													courseId: group.courseId,
													courseName: group.courseName,
													recipientCount: group.entries.length,
												})
											}
											onDelete={setToDelete}
											removePending={remove.isPending}
										/>
									))}
								</Stack>
							)}
						</>
					)}

					<ConfirmDialog
						open={Boolean(toDelete)}
						title='Potwierdź usunięcie'
						cancelLabel='Anuluj'
						confirmLabel='Usuń'
						loading={remove.isPending}
						onCancel={() => setToDelete(null)}
						onConfirm={() => {
							if (toDelete) remove.mutate(toDelete.id);
						}}
					>
						<Typography>
							Czy na pewno chcesz usunąć <strong>{toDelete?.userName}</strong> z listy oczekujących
							na <strong>{toDelete?.courseName}</strong>? Tej operacji nie można cofnąć.
						</Typography>
					</ConfirmDialog>

					<WaitlistNotifyDialog
						open={Boolean(composeTarget) && !confirmDraft}
						target={composeTarget}
						loading={false}
						onClose={() => setComposeTarget(null)}
						onSubmit={({ subject, body }) => {
							if (!composeTarget) return;
							setConfirmDraft({ target: composeTarget, subject, body });
						}}
					/>

					<ConfirmDialog
						open={Boolean(confirmDraft)}
						title='Potwierdź wysyłkę'
						cancelLabel='Anuluj'
						confirmLabel='Wyślij'
						loading={notify.isPending}
						onCancel={() => setConfirmDraft(null)}
						onConfirm={() => {
							if (!confirmDraft) return;
							const { target, subject, body } = confirmDraft;
							notify.mutate({
								scope: target.scope,
								courseId: target.scope === 'course' ? target.courseId : undefined,
								subject,
								body,
							});
						}}
					>
						<Typography>
							Wyślesz e-mail do{' '}
							<strong>{confirmDraft?.target.recipientCount ?? 0}</strong>
							{confirmDraft?.target.scope === 'all'
								? ' wpisów na całej liście oczekujących'
								: ` osób na liście „${confirmDraft?.target.scope === 'course' ? confirmDraft.target.courseName : ''}”`}
							. Kontynuować?
						</Typography>
					</ConfirmDialog>
				</Box>
			)}
		</ContentSwap>
	);
};

type GroupProps = {
	readonly group: WaitingListCourseGroup;
	readonly open: boolean;
	readonly lastEmailedAt?: string;
	readonly onToggle: () => void;
	readonly onEmail: () => void;
	readonly onDelete: (entry: CourseWaitingListEntry) => void;
	readonly removePending: boolean;
};

const WaitingListGroup = ({
	group,
	open,
	lastEmailedAt,
	onToggle,
	onEmail,
	onDelete,
	removePending,
}: GroupProps) => (
	<Box
		sx={{
			border: '2px solid',
			borderColor: 'ink.main',
			bgcolor: 'background.paper',
		}}
	>
		<Stack
			direction={{ xs: 'column', md: 'row' }}
			spacing={1}
			sx={{
				px: 1.5,
				py: 1,
				alignItems: { md: 'center' },
				justifyContent: 'space-between',
				bgcolor: 'action.hover',
			}}
		>
			<Stack direction='row' spacing={0.5} sx={{ alignItems: 'center', minWidth: 0, flex: 1 }}>
				<IconButton
					size='small'
					onClick={onToggle}
					aria-expanded={open}
					aria-label={open ? 'Zwiń' : 'Rozwiń'}
				>
					<ExpandMoreIcon
						sx={{
							transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
							transition: 'transform 0.15s',
						}}
					/>
				</IconButton>
				<Box sx={{ minWidth: 0 }}>
					<Typography sx={{ fontWeight: 700 }} noWrap>
						{group.courseName}{' '}
						<Typography component='span' color='text.secondary' sx={{ fontWeight: 500 }}>
							({group.entries.length})
						</Typography>
					</Typography>
					<Typography variant='caption' color='text.secondary'>
						{lastEmailedAt
							? `Ostatni e-mail: ${formatJoinedAt(lastEmailedAt)}`
							: 'Brak wysyłki'}
					</Typography>
				</Box>
			</Stack>
			<Button size='small' variant='outlined' onClick={onEmail}>
				Wyślij e-mail do wszystkich na tej liście
			</Button>
		</Stack>
		<Collapse in={open}>
			<Divider />
			{group.entries.length === 0 ? (
				<Typography color='text.secondary' sx={{ px: 2, py: 1.5 }} variant='body2'>
					Brak osób na liście tego kursu.
				</Typography>
			) : (
				<Box component='ul' sx={{ listStyle: 'none', m: 0, p: 0 }}>
					{group.entries.map((entry, index) => (
						<Box
							component='li'
							key={entry.id}
							sx={{
								display: 'flex',
								flexWrap: 'wrap',
								alignItems: 'center',
								gap: 1,
								px: 1.5,
								py: 0.75,
								borderTop: index === 0 ? 'none' : '1px solid',
								borderColor: 'divider',
							}}
						>
							<Typography variant='body2' sx={{ fontWeight: 600, minWidth: 120 }}>
								{entry.guest ? 'Gość' : entry.userName}
							</Typography>
							<Typography variant='body2' color='text.secondary' sx={{ flex: 1, minWidth: 140 }}>
								{entry.email}
								{entry.phoneNumber ? ` · ${entry.phoneNumber}` : ''}
								{entry.guest ? ' · bez konta' : ''}
							</Typography>
							<Typography variant='caption' color='text.secondary' sx={{ minWidth: 140 }}>
								{formatJoinedAt(entry.createdAt)}
							</Typography>
							<Button
								size='small'
								color='error'
								variant='text'
								disabled={removePending}
								onClick={() => onDelete(entry)}
							>
								Usuń
							</Button>
						</Box>
					))}
				</Box>
			)}
		</Collapse>
	</Box>
);
