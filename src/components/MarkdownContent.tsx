'use client';

import { Box } from '@ui';
import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import type { ReactNode } from 'react';
import { extractYoutubeId, youtubeEmbedUrl } from '@/utils/youtube';

type Props = {
	readonly content: string;
};

const YoutubeEmbed = ({ videoId }: { readonly videoId: string }) => (
	<Box
		sx={{
			position: 'relative',
			width: '100%',
			maxWidth: 720,
			aspectRatio: '16 / 9',
			my: 2,
			border: '3px solid',
			borderColor: 'ink.main',
			overflow: 'hidden',
			bgcolor: 'ink.main',
		}}
	>
		<Box
			component='iframe'
			src={youtubeEmbedUrl(videoId)}
			title='Film YouTube'
			allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
			allowFullScreen
			sx={{
				position: 'absolute',
				inset: 0,
				width: '100%',
				height: '100%',
				border: 0,
			}}
		/>
	</Box>
);

const childText = (children: ReactNode): string => {
	if (typeof children === 'string') return children;
	if (typeof children === 'number') return String(children);
	if (Array.isArray(children)) return children.map(childText).join('');
	return '';
};

const markdownComponents: Components = {
	a: ({ href, children }) => {
		const id = extractYoutubeId(href);
		if (id) return <YoutubeEmbed videoId={id} />;
		return (
			<Box
				component='a'
				href={href}
				target='_blank'
				rel='noopener noreferrer'
				sx={{ color: 'primary.main' }}
			>
				{children}
			</Box>
		);
	},
	img: ({ src, alt }) => {
		const srcStr = typeof src === 'string' ? src : null;
		if (!srcStr) return null;
		const id = extractYoutubeId(srcStr);
		if (id) return <YoutubeEmbed videoId={id} />;
		return (
			<Box
				component='img'
				src={srcStr}
				alt={alt ?? ''}
				sx={{
					display: 'block',
					maxWidth: '100%',
					height: 'auto',
					my: 2,
					border: '3px solid',
					borderColor: 'ink.main',
				}}
			/>
		);
	},
	p: ({ children }) => {
		const text = childText(children).trim();
		const id = extractYoutubeId(text);
		if (id) return <YoutubeEmbed videoId={id} />;
		return <Box component='p' sx={{ mb: 1.5 }}>{children}</Box>;
	},
};

export const MarkdownContent = ({ content }: Props) => (
	<Box
		sx={{
			'& h1, & h2, & h3': { mt: 2, mb: 1 },
			'& ul, & ol': { pl: 3, mb: 1.5 },
			'& li': { mb: 0.5 },
			'& blockquote': {
				borderLeft: '3px solid',
				borderColor: 'ink.main',
				pl: 2,
				my: 2,
				color: 'text.secondary',
			},
			'& code': {
				fontFamily: 'var(--font-mono, monospace)',
				fontSize: '0.875em',
				px: 0.5,
				bgcolor: 'surface.muted',
			},
			'& pre': {
				p: 2,
				overflow: 'auto',
				bgcolor: 'surface.muted',
				border: '1px solid',
				borderColor: 'divider',
				mb: 2,
			},
		}}
	>
		<ReactMarkdown
			remarkPlugins={[remarkGfm, remarkBreaks]}
			components={markdownComponents}
		>
			{content}
		</ReactMarkdown>
	</Box>
);
