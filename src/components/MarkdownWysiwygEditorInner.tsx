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
	Stack,
	TextField,
	Typography,
} from '@ui';
import { ImageOutlined, YouTube } from '@ui/icons';
import MDEditor, { commands, type ICommand, type TextAreaTextApi, type TextState } from '@uiw/react-md-editor';
import rehypeSanitize from 'rehype-sanitize';
import { useState } from 'react';
import { extractYoutubeId } from '@/utils/youtube';

import '@uiw/react-md-editor/markdown-editor.css';

type Props = {
	readonly value: string;
	readonly onChange: (value: string) => void;
	readonly height?: number;
};

type MediaDialog = 'image' | 'youtube' | null;

const baseCommands = commands.getCommands().filter((cmd) => cmd.name !== 'image');

const insertBlock = (api: TextAreaTextApi, block: string) => {
	api.replaceSelection(`\n\n${block}\n\n`);
};

export const MarkdownWysiwygEditorInner = ({ value, onChange, height = 480 }: Props) => {
	const [dialog, setDialog] = useState<MediaDialog>(null);
	const [mediaUrl, setMediaUrl] = useState('');
	const [imageAlt, setImageAlt] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [pendingApi, setPendingApi] = useState<TextAreaTextApi | null>(null);

	const openMedia = (kind: Exclude<MediaDialog, null>, api: TextAreaTextApi) => {
		setPendingApi(api);
		setMediaUrl('');
		setImageAlt('');
		setError(null);
		setDialog(kind);
	};

	const closeDialog = () => {
		setDialog(null);
		setPendingApi(null);
		setError(null);
	};

	const confirmMedia = () => {
		if (!pendingApi) return;
		const url = mediaUrl.trim();
		if (!url) {
			setError('Podaj adres URL.');
			return;
		}
		if (dialog === 'youtube') {
			const id = extractYoutubeId(url);
			if (!id) {
				setError('To nie wygląda na link do YouTube.');
				return;
			}
			insertBlock(pendingApi, url.startsWith('http') ? url : `https://${url}`);
			closeDialog();
			return;
		}
		const alt = imageAlt.trim() || 'ilustracja';
		insertBlock(pendingApi, `![${alt}](${url})`);
		closeDialog();
	};

	const imageCommand: ICommand = {
		name: 'image-url',
		keyCommand: 'image-url',
		buttonProps: { 'aria-label': 'Wstaw obraz z URL', title: 'Obraz (URL)' },
		icon: <ImageOutlined sx={{ fontSize: 16 }} />,
		execute: (_state: TextState, api: TextAreaTextApi) => {
			openMedia('image', api);
		},
	};

	const youtubeCommand: ICommand = {
		name: 'youtube',
		keyCommand: 'youtube',
		buttonProps: { 'aria-label': 'Wstaw film YouTube', title: 'YouTube' },
		icon: <YouTube sx={{ fontSize: 16 }} />,
		execute: (_state: TextState, api: TextAreaTextApi) => {
			openMedia('youtube', api);
		},
	};

	return (
		<>
			<Box
				data-color-mode='light'
				sx={{
					'& .w-md-editor': {
						border: '1px solid',
						borderColor: 'divider',
						borderRadius: 1,
						boxShadow: 'none',
					},
					'& .w-md-editor-toolbar': {
						borderBottom: '1px solid',
						borderColor: 'divider',
						bgcolor: 'surface.muted',
					},
				}}
			>
				<MDEditor
					value={value}
					onChange={(next) => onChange(next ?? '')}
					height={height}
					preview='live'
					visibleDragbar={false}
					commands={[...baseCommands, imageCommand, youtubeCommand]}
					extraCommands={commands.getExtraCommands()}
					previewOptions={{
						rehypePlugins: [[rehypeSanitize]],
					}}
				/>
			</Box>
			<Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 1 }}>
				Markdown z podglądem na żywo. Obrazy: URL. Filmy: link YouTube (osobna linia lub
				przycisk).
			</Typography>

			<HardShadowDialog open={Boolean(dialog)} onClose={closeDialog} maxWidth='sm' fullWidth>
				<DialogTitle sx={hardShadowDialogTitleSx}>
					{dialog === 'youtube' ? 'Film YouTube' : 'Obraz z URL'}
				</DialogTitle>
				<DialogContent sx={[hardShadowDialogContentSx, { gap: 2 }]}>
					<Stack spacing={2}>
						<TextField
							label={dialog === 'youtube' ? 'Link YouTube' : 'URL obrazu'}
							fullWidth
							size='small'
							value={mediaUrl}
							onChange={(e) => setMediaUrl(e.target.value)}
							placeholder={
								dialog === 'youtube'
									? 'https://www.youtube.com/watch?v=…'
									: 'https://…'
							}
							autoFocus
						/>
						{dialog === 'image' ? (
							<TextField
								label='Tekst alternatywny'
								fullWidth
								size='small'
								value={imageAlt}
								onChange={(e) => setImageAlt(e.target.value)}
							/>
						) : null}
						{error ? (
							<Typography variant='body2' color='error'>
								{error}
							</Typography>
						) : null}
					</Stack>
				</DialogContent>
				<DialogActions sx={hardShadowDialogActionsSx}>
					<Button onClick={closeDialog}>Anuluj</Button>
					<Button variant='contained' onClick={confirmMedia}>
						Wstaw
					</Button>
				</DialogActions>
			</HardShadowDialog>
		</>
	);
};
