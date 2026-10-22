'use client';

import { AdminStickyActions, MarkdownWysiwygEditor } from '@components';
import { DEFAULT_COURSE_DEBRIEFING_MD } from '@constants/debriefingMarkdown';
import { PAGE_CONTENT_MAX_WIDTH } from '@constants/layout';
import { Paths } from '@constants/paths';
import { getCourseDebriefing, saveCourseDebriefing } from '@services/courseDebriefings';
import { getCourse } from '@services/courses';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
	Box,
	Button,
	CircularProgress,
	ConfirmDialog,
	ContentSwap,
	MotionAlert,
	Stack,
	Typography,
} from '@ui';
import { ArrowBackIcon, OpenInNewIcon } from '@ui/icons';
import NextLink from 'next/link';
import { useEffect, useState } from 'react';
import { formatDebriefingMeta } from '@/utils/debriefingMeta';
import { fillPath } from '@/utils/paths';

type Props = {
	readonly courseId: string;
};

export const AdminDebriefingEditView = ({ courseId }: Props) => <EditInner courseId={courseId} />;

const EditInner = ({ courseId }: Props) => {
	const queryClient = useQueryClient();
	const { data: course, isLoading: courseLoading } = useQuery({
		queryKey: ['course', courseId],
		queryFn: () => getCourse(courseId),
	});
	const { data: debriefing, isLoading: debriefingLoading } = useQuery({
		queryKey: ['courseDebriefing', courseId],
		queryFn: () => getCourseDebriefing(courseId),
	});

	const [content, setContent] = useState('');
	const [savedContent, setSavedContent] = useState('');
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [saveOpen, setSaveOpen] = useState(false);
	const [resetOpen, setResetOpen] = useState(false);
	const [seeded, setSeeded] = useState(false);

	const isLoading = courseLoading || debriefingLoading;

	useEffect(() => {
		if (isLoading || seeded) return;
		if (debriefing?.content) {
			setContent(debriefing.content);
			setSavedContent(debriefing.content);
		} else {
			setContent(DEFAULT_COURSE_DEBRIEFING_MD);
			setSavedContent('');
		}
		setSeeded(true);
	}, [debriefing, isLoading, seeded]);

	const isDirty = content !== savedContent;
	const metaLabel = debriefing ? formatDebriefingMeta(debriefing) : null;

	if (!isLoading && !course) {
		return (
			<Box>
				<Typography color='error'>Nie znaleziono szkolenia.</Typography>
				<Button component={NextLink} href={Paths.adminDebriefings} sx={{ mt: 2 }}>
					Wróć do listy
				</Button>
			</Box>
		);
	}

	return (
		<ContentSwap state={isLoading ? 'loading' : 'content'}>
			{isLoading ? (
				<CircularProgress />
			) : (
				<Box sx={{ maxWidth: PAGE_CONTENT_MAX_WIDTH }}>
					<Button
						component={NextLink}
						href={Paths.adminDebriefings}
						startIcon={<ArrowBackIcon />}
						size='small'
						sx={{ mb: 2 }}
					>
						Lista debriefingów
					</Button>
					<Stack
						direction={{ xs: 'column', sm: 'row' }}
						sx={{
							mb: 2,
							alignItems: { sm: 'center' },
							justifyContent: 'space-between',
							gap: 1,
						}}
					>
						<Box>
							<Typography variant='h5'>Debriefing — {course?.name}</Typography>
							<Typography variant='body2' color='text.secondary'>
								/{course?.slug}
							</Typography>
						</Box>
						{savedContent ? (
							<Button
								component={NextLink}
								href={fillPath(Paths.profilDebriefingDetail, { courseId })}
								target='_blank'
								rel='noopener noreferrer'
								startIcon={<OpenInNewIcon />}
								size='small'
							>
								Podgląd (profil)
							</Button>
						) : null}
					</Stack>
					<Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 1 }}>
						{metaLabel
							? `${metaLabel} · każdy zapis tworzy nową wersję`
							: 'Pierwszy zapis opublikuje wersję 1'}
					</Typography>

					<MarkdownWysiwygEditor value={content} onChange={setContent} />

					<MotionAlert show={Boolean(message)} severity='success' sx={{ mt: 2, mb: 1 }}>
						{message}
					</MotionAlert>
					<AdminStickyActions>
						<Button
							variant='contained'
							disabled={saving || !isDirty || !course}
							onClick={() => setSaveOpen(true)}
						>
							Zapisz
						</Button>
						<Button variant='outlined' onClick={() => setResetOpen(true)} disabled={saving}>
							Przywróć szablon
						</Button>
					</AdminStickyActions>

					<ConfirmDialog
						open={saveOpen}
						title='Potwierdź zapis debriefingu'
						cancelLabel='Anuluj'
						confirmLabel='Zapisz'
						confirmColor='primary'
						loading={saving}
						onCancel={() => setSaveOpen(false)}
						onConfirm={() => {
							if (!course) return;
							setSaving(true);
							setMessage(null);
							void saveCourseDebriefing({ course, content })
								.then(async () => {
									setSavedContent(content);
									setMessage('Zapisano.');
									setSaveOpen(false);
									await queryClient.invalidateQueries({
										queryKey: ['courseDebriefing', courseId],
									});
									await queryClient.invalidateQueries({
										queryKey: ['courseDebriefings'],
									});
								})
								.finally(() => setSaving(false));
						}}
					>
						Czy na pewno chcesz opublikować debriefing? Zobaczą go tylko użytkownicy oznaczeni jako
						absolwenci tego szkolenia.
					</ConfirmDialog>

					<ConfirmDialog
						open={resetOpen}
						title='Potwierdź przywrócenie szablonu'
						cancelLabel='Anuluj'
						confirmLabel='Przywróć'
						confirmColor='warning'
						onCancel={() => setResetOpen(false)}
						onConfirm={() => {
							setContent(DEFAULT_COURSE_DEBRIEFING_MD);
							setResetOpen(false);
						}}
					>
						Czy na pewno chcesz zastąpić bieżącą treść domyślnym szablonem? Zmiany nie zostaną
						zapisane, dopóki nie klikniesz „Zapisz”.
					</ConfirmDialog>
				</Box>
			)}
		</ContentSwap>
	);
};
