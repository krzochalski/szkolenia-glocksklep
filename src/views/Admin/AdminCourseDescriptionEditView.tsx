'use client';

import { PAGE_CONTENT_MAX_WIDTH } from '@constants/layout';
import { getCourseDescriptionBySlug, saveCourseDescription } from '@services/courseDescriptions';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Box, CircularProgress, ContentSwap, Typography } from '@ui';
import { CourseDescriptionForm } from './forms/CourseDescriptionForm';

type Props = {
	readonly slug: string;
};

export const AdminCourseDescriptionEditView = ({ slug }: Props) => <EditInner slug={slug} />;

const EditInner = ({ slug }: Props) => {
	const queryClient = useQueryClient();
	const { data, isLoading } = useQuery({
		queryKey: ['courseDescription', slug],
		queryFn: () => getCourseDescriptionBySlug(slug),
	});

	return (
		<ContentSwap state={isLoading ? 'loading' : 'content'}>
			{isLoading ? (
				<CircularProgress />
			) : (
				<Box sx={{ maxWidth: PAGE_CONTENT_MAX_WIDTH }}>
					<Typography variant='h5' gutterBottom>
						Opis: /{slug}
					</Typography>
					<CourseDescriptionForm
						key={data?.id ?? `new-${slug}`}
						slug={slug}
						defaultValues={data ?? null}
						onSubmit={async (payload) => {
							await saveCourseDescription(payload);
							await queryClient.invalidateQueries({ queryKey: ['courseDescription', slug] });
							await queryClient.invalidateQueries({ queryKey: ['courseDescriptions'] });
						}}
					/>
				</Box>
			)}
		</ContentSwap>
	);
};
