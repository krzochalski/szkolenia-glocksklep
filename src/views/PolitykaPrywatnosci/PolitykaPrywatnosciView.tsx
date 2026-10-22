'use client';

import { getPrivacyPolicy } from '@services/privacyPolicy';
import { Box, CircularProgress, ContentSwap, Typography } from '@ui';
import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import type { PrivacyPolicyDocument } from '@/types/privacyPolicy';

type Props = {
	readonly initialPrivacyPolicy?: PrivacyPolicyDocument;
};

export const PolitykaPrywatnosciView = ({ initialPrivacyPolicy }: Props) => {
	const { data, isLoading } = useQuery({
		queryKey: ['privacyPolicy'],
		queryFn: getPrivacyPolicy,
		...(initialPrivacyPolicy !== undefined ? { initialData: initialPrivacyPolicy } : {}),
	});

	return (
		<Box sx={{ width: '100%' }}>
			<Typography variant='h4' component='h1' gutterBottom>
				Polityka prywatności
			</Typography>
			<ContentSwap state={isLoading ? 'loading' : 'content'}>
				{isLoading ? (
					<Box sx={{ display: 'flex', justifyContent: 'center' }}>
						<CircularProgress />
					</Box>
				) : (
					<Box
						sx={{
							'& h1, & h2, & h3': { mt: 2, mb: 1 },
							'& p': { mb: 1.5 },
							'& ul': { pl: 3 },
						}}
					>
						<ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
							{data?.content ?? ''}
						</ReactMarkdown>
					</Box>
				)}
			</ContentSwap>
		</Box>
	);
};
