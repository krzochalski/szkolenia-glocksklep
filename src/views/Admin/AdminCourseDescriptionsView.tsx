'use client';

import { Paths } from '@constants/paths';
import { getCourseDescriptions } from '@services/courseDescriptions';
import { fillPath } from '@/utils/paths';
import {
	Box,
	CircularProgress,
	ContentSwap,
	Link,
	Paper,
	Stagger,
	StaggerItem,
	Typography,
} from '@ui';
import { useQuery } from '@tanstack/react-query';
import NextLink from 'next/link';

export const AdminCourseDescriptionsView = () => <DescInner />;

const DescInner = () => {
	const { data: items = [], isLoading } = useQuery({
		queryKey: ['courseDescriptions'],
		queryFn: getCourseDescriptions,
	});

	return (
		<ContentSwap state={isLoading ? 'loading' : 'content'}>
			{isLoading ? (
				<CircularProgress />
			) : (
		<Box>
			<Typography variant='h5' gutterBottom>
				Opisy szkoleń
			</Typography>
			<Stagger sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
				{items.map((item) => (
					<StaggerItem key={item.id}>
					<Paper variant='outlined' sx={{ p: 2 }}>
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
					</StaggerItem>
				))}
			</Stagger>
		</Box>
			)}
		</ContentSwap>
	);
};
