'use client';

import { getRegulamin } from '@services/regulamin';
import { Box, CircularProgress, Typography } from '@ui';
import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

export const RegulaminView = () => {
	const { data, isLoading } = useQuery({
		queryKey: ['regulamin'],
		queryFn: getRegulamin,
	});

	if (isLoading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center' }}>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Box sx={{ maxWidth: 800 }}>
			<Typography variant='h4' component='h1' gutterBottom>
				Regulamin
			</Typography>
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
		</Box>
	);
};
