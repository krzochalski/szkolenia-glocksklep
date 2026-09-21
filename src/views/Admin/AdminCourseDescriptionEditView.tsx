'use client';

import {
	getCourseDescriptionBySlug,
	saveCourseDescription,
} from '@services/courseDescriptions';
import { Box, CircularProgress, Typography } from '@ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminGate } from './AdminGate';
import { CourseDescriptionForm } from './forms/CourseDescriptionForm';

type Props = {
	readonly slug: string;
};

export const AdminCourseDescriptionEditView = ({ slug }: Props) => (
	<AdminGate>
		<EditInner slug={slug} />
	</AdminGate>
);

const EditInner = ({ slug }: Props) => {
	const queryClient = useQueryClient();
	const { data, isLoading } = useQuery({
		queryKey: ['courseDescription', slug],
		queryFn: () => getCourseDescriptionBySlug(slug),
	});

	if (isLoading) return <CircularProgress />;

	return (
		<Box sx={{ maxWidth: 960 }}>
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
	);
};
