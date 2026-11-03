'use client';

import {
	DEFAULT_DATE_NOTIFY_BODY_MARKDOWN,
	DEFAULT_DATE_NOTIFY_SUBJECT,
	DATE_NOTIFY_PLACEHOLDERS,
} from '@constants/dateNotifyTemplate';
import {
	Box,
	Button,
	Checkbox,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	FormControlLabel,
	FormLabel,
	HardShadowDialog,
	hardShadowDialogActionsSx,
	hardShadowDialogContentSx,
	hardShadowDialogTitleSx,
	MenuItem,
	Radio,
	RadioGroup,
	Stack,
	TextField,
	Typography,
} from '@ui';
import { useEffect, useMemo, useState } from 'react';
import { MarkdownContent } from '@/components/MarkdownContent';
import type { Course, CourseClass, Participant } from '@/types/course';
import type { CourseWaitingListEntry } from '@/types/courseWaitingList';
import {
	applyDateNotifyPlaceholders,
	buildDateNotifyVars,
	findUnknownDateNotifyPlaceholders,
	formatDateNotifyRequirements,
	resolveDateNotifyRecipients,
	type DateNotifyRecipientMode,
} from '@/utils/dateNotify';

export type DateNotifyComposePayload = {
	subject: string;
	bodyMarkdown: string;
	recipientMode: DateNotifyRecipientMode;
	manualParticipantIds: string[];
	recipientCount: number;
};

type Props = {
	readonly open: boolean;
	readonly course: Course;
	readonly date: CourseClass;
	readonly waitlistEntries: CourseWaitingListEntry[];
	readonly requirements?: {
		ownGun?: boolean;
		holster?: boolean;
		roundCount?: number;
	} | null;
	readonly loading: boolean;
	readonly onClose: () => void;
	readonly onSubmit: (payload: DateNotifyComposePayload) => void;
	readonly onTestSend: (payload: DateNotifyComposePayload) => void;
};

export const DateNotifyDialog = ({
	open,
	course,
	date,
	waitlistEntries,
	requirements,
	loading,
	onClose,
	onSubmit,
	onTestSend,
}: Props) => {
	const participants = date.participants ?? [];
	const [subject, setSubject] = useState(DEFAULT_DATE_NOTIFY_SUBJECT);
	const [bodyMarkdown, setBodyMarkdown] = useState(DEFAULT_DATE_NOTIFY_BODY_MARKDOWN);
	const [recipientMode, setRecipientMode] = useState<DateNotifyRecipientMode>('confirmed');
	const [manualIds, setManualIds] = useState<string[]>([]);
	const [manualSearch, setManualSearch] = useState('');
	const [previewParticipantId, setPreviewParticipantId] = useState<string>('');

	const firstParticipantId = participants[0]?.id ?? '';

	useEffect(() => {
		if (!open) return;
		setSubject(DEFAULT_DATE_NOTIFY_SUBJECT);
		setBodyMarkdown(DEFAULT_DATE_NOTIFY_BODY_MARKDOWN);
		setRecipientMode('confirmed');
		setManualIds([]);
		setManualSearch('');
		setPreviewParticipantId(firstParticipantId);
	}, [open, firstParticipantId]);

	const requirementsText = formatDateNotifyRequirements(requirements);

	const previewParticipant: Participant | undefined =
		participants.find((p) => p.id === previewParticipantId) ?? participants[0];

	const previewMarkdown = useMemo(() => {
		const vars = buildDateNotifyVars({
			course,
			date,
			recipientName: previewParticipant?.name ?? 'Uczestnik',
			participant: previewParticipant,
			requirementsText,
		});
		return applyDateNotifyPlaceholders(bodyMarkdown, vars, { escapeValues: false });
	}, [bodyMarkdown, course, date, previewParticipant, requirementsText]);

	const unknown = findUnknownDateNotifyPlaceholders(subject, bodyMarkdown);

	const resolved = resolveDateNotifyRecipients({
		mode: recipientMode,
		participants,
		waitlistEntries,
		manualParticipantIds: manualIds,
	});

	const filteredManual = useMemo(() => {
		const q = manualSearch.trim().toLowerCase();
		if (!q) return participants;
		return participants.filter(
			(p) =>
				p.name.toLowerCase().includes(q) ||
				p.email.toLowerCase().includes(q)
		);
	}, [manualSearch, participants]);

	const insertVariable = (key: string) => {
		const token = `{{${key}}}`;
		setBodyMarkdown((prev) => `${prev}${prev.endsWith('\n') || prev === '' ? '' : ' '}${token}`);
	};

	const payload = (): DateNotifyComposePayload => ({
		subject: subject.trim(),
		bodyMarkdown: bodyMarkdown.trim(),
		recipientMode,
		manualParticipantIds: manualIds,
		recipientCount: resolved.recipients.length,
	});

	const canSend =
		Boolean(subject.trim()) &&
		Boolean(bodyMarkdown.trim()) &&
		unknown.length === 0 &&
		(recipientMode !== 'manual' || manualIds.length > 0) &&
		resolved.recipients.length > 0;

	return (
		<HardShadowDialog
			open={open}
			onClose={loading ? undefined : onClose}
			maxWidth='md'
			fullWidth
		>
			<DialogTitle sx={hardShadowDialogTitleSx}>
				Wyślij wiadomość do uczestników
			</DialogTitle>
			<DialogContent sx={[hardShadowDialogContentSx, { gap: 2 }]}>
				<FormControl>
					<FormLabel>Odbiorcy</FormLabel>
					<RadioGroup
						value={recipientMode}
						onChange={(e) =>
							setRecipientMode(e.target.value as DateNotifyRecipientMode)
						}
					>
						<FormControlLabel
							value='confirmed'
							control={<Radio />}
							label={`Wszyscy zapisani (${participants.length})`}
							disabled={loading}
						/>
						<FormControlLabel
							value='waitlist'
							control={<Radio />}
							label={`Lista oczekujących kursu (${waitlistEntries.length})`}
							disabled={loading}
						/>
						<FormControlLabel
							value='manual'
							control={<Radio />}
							label='Ręczny wybór'
							disabled={loading}
						/>
					</RadioGroup>
				</FormControl>

				{recipientMode === 'manual' ? (
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
						<TextField
							label='Szukaj uczestnika'
							size='small'
							value={manualSearch}
							onChange={(e) => setManualSearch(e.target.value)}
							disabled={loading}
						/>
						<Typography variant='caption' color='text.secondary'>
							Zaznaczono: {manualIds.length}
						</Typography>
						<Box
							sx={{
								maxHeight: 160,
								overflow: 'auto',
								border: 1,
								borderColor: 'divider',
								px: 1,
							}}
						>
							{filteredManual.map((p) => (
								<FormControlLabel
									key={p.id}
									control={
										<Checkbox
											checked={manualIds.includes(p.id)}
											disabled={loading || !p.email}
											onChange={(_, checked) => {
												setManualIds((prev) =>
													checked
														? [...prev, p.id]
														: prev.filter((id) => id !== p.id)
												);
											}}
										/>
									}
									label={
										!p.email
											? `${p.name} (brak e-mail)`
											: `${p.name} <${p.email}>`
									}
								/>
							))}
						</Box>
					</Box>
				) : null}

				<Typography variant='body2' color='text.secondary'>
					Do wysyłki po deduplikacji: <strong>{resolved.recipients.length}</strong>
					{resolved.skippedInvalid > 0
						? ` · pominięto bez e-mail: ${resolved.skippedInvalid}`
						: ''}
					{resolved.skippedDuplicate > 0
						? ` · duplikaty e-mail: ${resolved.skippedDuplicate}`
						: ''}
				</Typography>

				<TextField
					label='Temat'
					fullWidth
					size='small'
					value={subject}
					onChange={(e) => setSubject(e.target.value)}
					disabled={loading}
				/>

				<Box>
					<Typography variant='caption' color='text.secondary' component='p' sx={{ m: 0, mb: 0.5 }}>
						Zmienne (kliknij, aby wstawić):
					</Typography>
					<Stack direction='row' spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
						{DATE_NOTIFY_PLACEHOLDERS.map((p) => (
							<Button
								key={p.key}
								size='small'
								variant='outlined'
								disabled={loading}
								onClick={() => insertVariable(p.key)}
								sx={{ textTransform: 'none' }}
							>
								{`{{${p.key}}}`}
							</Button>
						))}
					</Stack>
				</Box>

				{unknown.length > 0 ? (
					<Typography variant='body2' color='error'>
						Nieznane zmienne: {unknown.map((k) => `{{${k}}}`).join(', ')}
					</Typography>
				) : null}

				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
						gap: 2,
					}}
				>
					<TextField
						label='Treść (Markdown)'
						fullWidth
						multiline
						minRows={14}
						value={bodyMarkdown}
						onChange={(e) => setBodyMarkdown(e.target.value)}
						disabled={loading}
						sx={{ '& textarea': { fontFamily: 'monospace', fontSize: 13 } }}
					/>
					<Box>
						{participants.length > 1 ? (
							<TextField
								select
								label='Podgląd dla'
								size='small'
								fullWidth
								value={previewParticipant?.id ?? ''}
								onChange={(e) => setPreviewParticipantId(e.target.value)}
								disabled={loading}
								sx={{ mb: 1 }}
							>
								{participants.map((p) => (
									<MenuItem key={p.id} value={p.id}>
										{p.name}
									</MenuItem>
								))}
							</TextField>
						) : null}
						<Typography variant='caption' color='text.secondary'>
							Podgląd
						</Typography>
						<Box
							sx={{
								border: 1,
								borderColor: 'divider',
								p: 1.5,
								maxHeight: 360,
								overflow: 'auto',
								bgcolor: 'background.paper',
							}}
						>
							<MarkdownContent content={previewMarkdown} />
						</Box>
					</Box>
				</Box>
			</DialogContent>
			<DialogActions sx={hardShadowDialogActionsSx}>
				<Button onClick={onClose} disabled={loading}>
					Anuluj
				</Button>
				<Button
					variant='outlined'
					disabled={loading || unknown.length > 0 || !subject.trim() || !bodyMarkdown.trim()}
					onClick={() => onTestSend(payload())}
				>
					Wyślij test do mnie
				</Button>
				<Button
					variant='contained'
					disabled={loading || !canSend}
					onClick={() => onSubmit(payload())}
				>
					Wyślij
				</Button>
			</DialogActions>
		</HardShadowDialog>
	);
};
