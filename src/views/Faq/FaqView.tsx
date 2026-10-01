'use client';

import { getFaqItems } from '@services/faq';
import {
	Box,
	CircularProgress,
	ContentSwap,
	Link,
	Stagger,
	StaggerItem,
	Typography,
} from '@ui';
import { useQuery } from '@tanstack/react-query';

export const FaqView = () => {
	const { data: items = [], isLoading } = useQuery({
		queryKey: ['faq'],
		queryFn: getFaqItems,
	});

	const listState = isLoading ? 'loading' : items.length === 0 ? 'empty' : 'content';

	return (
		<Box sx={{ maxWidth: 800 }}>
			<Typography variant='h4' component='h1' gutterBottom>
				FAQ
			</Typography>
			<Typography color='text.secondary' sx={{ mb: 3 }}>
				Najczęściej zadawane pytania.
			</Typography>
			<ContentSwap state={listState}>
				{isLoading ? (
					<Box sx={{ display: 'flex', justifyContent: 'center' }}>
						<CircularProgress />
					</Box>
				) : items.length === 0 ? (
					<Typography color='text.secondary'>Brak pytań na liście.</Typography>
				) : (
					<Stagger sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
						{items.map((item) => (
							<StaggerItem key={item.id}>
								<Box>
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
							</StaggerItem>
						))}
					</Stagger>
				)}
			</ContentSwap>
		</Box>
	);
};
