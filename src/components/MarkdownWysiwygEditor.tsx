'use client';

import { Box, CircularProgress } from '@ui';
import dynamic from 'next/dynamic';

const MarkdownWysiwygEditorInner = dynamic(
	() =>
		import('./MarkdownWysiwygEditorInner').then((m) => m.MarkdownWysiwygEditorInner),
	{
		ssr: false,
		loading: () => (
			<Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
				<CircularProgress />
			</Box>
		),
	}
);

type Props = {
	readonly value: string;
	readonly onChange: (value: string) => void;
	readonly height?: number;
};

export const MarkdownWysiwygEditor = (props: Props) => (
	<MarkdownWysiwygEditorInner {...props} />
);
