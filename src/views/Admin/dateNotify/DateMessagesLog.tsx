'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	Box,
	Button,
	Chip,
	CircularProgress,
	Collapse,
	Stack,
	Typography,
} from '@ui';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
	adminNotifyDateParticipants,
	listDateMessageRecipients,
	listDateMessages,
} from '@services/dateNotify';
import type { DateMessage } from '@/types/dateMessage';

type Props = {
	readonly courseId: string;
	readonly dateId: string;
};

const statusLabel = (status: DateMessage['status']): string => {
	switch (status) {
		case 'sent':
			return 'wysłane';
		case 'partiallyFailed':
			return 'częściowo';
		case 'failed':
			return 'błąd';
		case 'sending':
			return 'wysyłanie';
		case 'queued':
			return 'w kolejce';
		default:
			return status;
	}
};

const statusColor = (
	status: DateMessage['status']
): 'default' | 'success' | 'warning' | 'error' | 'info' => {
	switch (status) {
		case 'sent':
			return 'success';
		case 'partiallyFailed':
			return 'warning';
		case 'failed':
			return 'error';
		case 'sending':
		case 'queued':
			return 'info';
		default:
			return 'default';
	}
};

const formatWarsaw = (iso: string): string => {
	if (!iso) return '—';
	try {
		return new Intl.DateTimeFormat('pl-PL', {
			timeZone: 'Europe/Warsaw',
			dateStyle: 'short',
			timeStyle: 'short',
		}).format(new Date(iso));
	} catch {
		return iso;
	}
};

const modeLabel = (mode: DateMessage['recipientMode']): string => {
	switch (mode) {
		case 'confirmed':
			return 'zapisani';
		case 'waitlist':
			return 'lista oczekujących';
		case 'manual':
			return 'ręczny wybór';
		default:
			return mode;
	}
};

export const DateMessagesLog = ({ courseId, dateId }: Props) => {
	const queryClient = useQueryClient();
	const [expandedId, setExpandedId] = useState<string | null>(null);

	const { data: messages = [], isLoading } = useQuery({
		queryKey: ['dateMessages', courseId, dateId],
		queryFn: () => listDateMessages(courseId, dateId),
	});

	const { data: recipients = [], isLoading: recipientsLoading } = useQuery({
		queryKey: ['dateMessageRecipients', courseId, expandedId],
		queryFn: () => {
			if (!expandedId) return Promise.resolve([]);
			return listDateMessageRecipients(courseId, expandedId);
		},
		enabled: Boolean(expandedId),
	});

	const retry = useMutation({
		mutationFn: async (messageId: string) =>
			adminNotifyDateParticipants({
				courseId,
				dateId,
				subject: 'retry',
				bodyMarkdown: 'retry',
				recipientMode: 'confirmed',
				idempotencyKey: uuidv4(),
				retryFailedOfMessageId: messageId,
			}),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['dateMessages', courseId, dateId] });
			if (expandedId) {
				await queryClient.invalidateQueries({
					queryKey: ['dateMessageRecipients', courseId, expandedId],
				});
			}
		},
	});

	if (isLoading) {
		return <CircularProgress size={24} />;
	}

	if (messages.length === 0) {
		return (
			<Typography variant='body2' color='text.secondary'>
				Brak wysłanych wiadomości dla tego terminu.
			</Typography>
		);
	}

	return (
		<Stack spacing={1.5}>
			{messages.map((msg) => {
				const open = expandedId === msg.id;
				return (
					<Box
						key={msg.id}
						sx={{
							border: 1,
							borderColor: 'divider',
							p: 1.5,
						}}
					>
						<Stack
							direction={{ xs: 'column', sm: 'row' }}
							spacing={1}
							sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
						>
							<Box>
								<Typography variant='subtitle2'>
									{msg.isTest ? '[TEST] ' : ''}
									{msg.subject}
								</Typography>
								<Typography variant='caption' color='text.secondary' component='p' sx={{ m: 0 }}>
									{formatWarsaw(msg.createdAt)} · {modeLabel(msg.recipientMode)} ·{' '}
									{msg.sentCount}/{msg.recipientCount} wysłane
									{msg.failedCount > 0 ? `, ${msg.failedCount} błędów` : ''}
								</Typography>
							</Box>
							<Stack direction='row' spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
								<Chip
									size='small'
									label={statusLabel(msg.status)}
									color={statusColor(msg.status)}
								/>
								<Button
									size='small'
									onClick={() => setExpandedId(open ? null : msg.id)}
								>
									{open ? 'Zwiń' : 'Szczegóły'}
								</Button>
								{msg.failedCount > 0 ? (
									<Button
										size='small'
										variant='outlined'
										disabled={retry.isPending}
										onClick={() => retry.mutate(msg.id)}
									>
										Ponów dla nieudanych
									</Button>
								) : null}
							</Stack>
						</Stack>
						<Collapse in={open}>
							<Box sx={{ mt: 1.5 }}>
								<Typography variant='caption' color='text.secondary'>
									Treść (Markdown)
								</Typography>
								<Box
									component='pre'
									sx={{
										m: 0,
										mb: 1,
										p: 1,
										bgcolor: 'action.hover',
										whiteSpace: 'pre-wrap',
										fontSize: 12,
										fontFamily: 'monospace',
										maxHeight: 160,
										overflow: 'auto',
									}}
								>
									{msg.bodyMarkdown}
								</Box>
								{recipientsLoading ? (
									<CircularProgress size={20} />
								) : (
									<Stack spacing={0.5}>
										{recipients.map((r) => (
											<Typography key={r.id} variant='body2'>
												{r.name ? `${r.name} · ` : ''}
												{r.email} — {r.status}
												{r.error ? ` (${r.error})` : ''}
												{r.attempts > 1 ? ` · próby: ${r.attempts}` : ''}
											</Typography>
										))}
									</Stack>
								)}
								{retry.isError ? (
									<Typography variant='body2' color='error' sx={{ mt: 1 }}>
										{(retry.error as Error).message}
									</Typography>
								) : null}
							</Box>
						</Collapse>
					</Box>
				);
			})}
		</Stack>
	);
};
