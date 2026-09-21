'use client';

import { getFaqItems } from '@services/faq';
import { Box, CircularProgress, Link, Stack, Typography } from '@ui';
import { useQuery } from '@tanstack/react-query';

export const FaqView = () => {
	const { data: items = [], isLoading } = useQuery({
		queryKey: ['faq'],
		queryFn: getFaqItems,
	});

	if (isLoading) {
		return (
			<Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Box sx={{ px: { xs: 2, md: 4 }, py: 4, maxWidth: 800, mx: 'auto' }}>
			<Typography variant='h4' component='h1' gutterBottom>
				FAQ
			</Typography>
			<Typography color='text.secondary' sx={{ mb: 3 }}>
				Najczęściej zadawane pytania.
			</Typography>
			<Stack spacing={3}>
				{items.map((item) => (
					<Box key={item.id}>
						<Typography variant='h6' component='h2' gutterBottom>
							{item.question}
						</Typography>
						<Typography sx={{ whiteSpace: 'pre-wrap' }}>{item.answer}</Typography>
						{item.link ? (
							<Link href={item.link.href} target='_blank' rel='noopener noreferrer'>
								{item.link.label}
							</Link>
						) : null}
					</Box>
				))}
				{items.length === 0 ? (
					<Typography color='text.secondary'>Brak pytań na liście.</Typography>
				) : null}
			</Stack>
		</Box>
	);
};
