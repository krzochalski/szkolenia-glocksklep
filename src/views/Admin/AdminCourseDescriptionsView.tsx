'use client';

import { Paths } from '@constants/paths';
import { getCourseDescriptions } from '@services/courseDescriptions';
import { fillPath } from '@/utils/paths';
import { Box, CircularProgress, Link, Paper, Stack, Typography } from '@ui';
import { useQuery } from '@tanstack/react-query';
import NextLink from 'next/link';
import { AdminGate } from './AdminGate';

export const AdminCourseDescriptionsView = () => (
	<AdminGate>
		<DescInner />
	</AdminGate>
);

const DescInner = () => {
	const { data: items = [], isLoading } = useQuery({
		queryKey: ['courseDescriptions'],
		queryFn: getCourseDescriptions,
	});

	if (isLoading) return <CircularProgress />;

	return (
		<Box>
			<Typography variant='h5' gutterBottom>
				Opisy szkoleń
			</Typography>
			<Stack spacing={1.5}>
				{items.map((item) => (
					<Paper key={item.id} variant='outlined' sx={{ p: 2 }}>
						<Link
							component={NextLink}
							href={fillPath(Paths.adminCourseDescriptionEdit, { slug: item.slug })}
							underline='hover'
							variant='subtitle1'
						>
							{item.headline.join(' ')}
						</Link>
						<Typography variant='body2' color='text.secondary'>
							/{item.slug}
						</Typography>
					</Paper>
				))}
			</Stack>
		</Box>
	);
};
