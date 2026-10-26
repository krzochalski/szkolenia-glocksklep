'use client';

import {
	Box,
	Button,
	DialogActions,
	DialogContent,
	DialogTitle,
	HardShadowDialog,
	hardShadowDialogActionsSx,
	hardShadowDialogContentSx,
	hardShadowDialogTitleSx,
	TextField,
	Typography,
} from '@ui';
import { useEffect, useState } from 'react';
import {
	DEFAULT_WAITLIST_NOTIFY_BODY,
	DEFAULT_WAITLIST_NOTIFY_SUBJECT,
	WAITLIST_NOTIFY_PLACEHOLDERS,
} from '@/utils/adminWaitingListGroups';

export type WaitlistNotifyTarget =
	| { scope: 'all'; recipientCount: number }
	| { scope: 'course'; courseId: string; courseName: string; recipientCount: number };

type Props = {
	readonly open: boolean;
	readonly target: WaitlistNotifyTarget | null;
	readonly loading: boolean;
	readonly onClose: () => void;
	readonly onSubmit: (payload: { subject: string; body: string }) => void;
};

export const WaitlistNotifyDialog = ({ open, target, loading, onClose, onSubmit }: Props) => {
	const [subject, setSubject] = useState(DEFAULT_WAITLIST_NOTIFY_SUBJECT);
	const [body, setBody] = useState(DEFAULT_WAITLIST_NOTIFY_BODY);

	useEffect(() => {
		if (!open) return;
		setSubject(DEFAULT_WAITLIST_NOTIFY_SUBJECT);
		setBody(DEFAULT_WAITLIST_NOTIFY_BODY);
	}, [open]);

	const title =
		target?.scope === 'course'
			? `E-mail — ${target.courseName}`
			: 'E-mail do całej listy oczekujących';

	return (
		<HardShadowDialog open={open} onClose={loading ? undefined : onClose} maxWidth='sm' fullWidth>
			<DialogTitle sx={hardShadowDialogTitleSx}>{title}</DialogTitle>
			<DialogContent sx={[hardShadowDialogContentSx, { gap: 2 }]}>
				<Typography variant='body2' color='text.secondary'>
					Odbiorcy: <strong>{target?.recipientCount ?? 0}</strong>
					{target?.scope === 'all' ? ' wpisów (wszystkie kursy)' : ' osób na tej liście'}.
				</Typography>
				<Typography variant='caption' color='text.secondary' component='p' sx={{ m: 0 }}>
					Placeholdery:{' '}
					{WAITLIST_NOTIFY_PLACEHOLDERS.map((p) => `{{${p.key}}}`).join(', ')}
				</Typography>
				<TextField
					label='Temat'
					fullWidth
					size='small'
					value={subject}
					onChange={(e) => setSubject(e.target.value)}
					disabled={loading}
				/>
				<TextField
					label='Treść'
					fullWidth
					multiline
					minRows={8}
					value={body}
					onChange={(e) => setBody(e.target.value)}
					disabled={loading}
				/>
				<Box>
					<Typography variant='caption' color='text.secondary'>
						Po „Wyślij” pojawi się potwierdzenie z liczbą odbiorców.
					</Typography>
				</Box>
			</DialogContent>
			<DialogActions sx={hardShadowDialogActionsSx}>
				<Button onClick={onClose} disabled={loading}>
					Anuluj
				</Button>
				<Button
					variant='contained'
					disabled={loading || !subject.trim() || !body.trim() || !target}
					onClick={() => onSubmit({ subject: subject.trim(), body: body.trim() })}
				>
					Dalej
				</Button>
			</DialogActions>
		</HardShadowDialog>
	);
};
