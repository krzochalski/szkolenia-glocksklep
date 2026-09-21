'use client';

import { CourseWaitingListActions } from '@/components/CourseWaitingListActions';
import { useAuthUser } from '@hooks';
import type { Course, CourseClass } from '@/types/course';
import { Alert, Box, Typography } from '@ui';
import { useState } from 'react';

type CourseWaitingListSectionProps = {
	readonly course: Course;
	readonly futureDates: CourseClass[];
};

const isEnrolledInFutureDate = (
	futureDates: CourseClass[],
	userId: string | undefined
): boolean => {
	if (!userId || futureDates.length === 0) return false;
	return futureDates.some((d) => d.participants?.some((p) => p.id === userId));
};

export const CourseWaitingListSection = ({
	course,
	futureDates,
}: CourseWaitingListSectionProps) => {
	const user = useAuthUser();
	const [error, setError] = useState<string | null>(null);
	const enrolled = isEnrolledInFutureDate(futureDates, user?.uid);

	if (enrolled) return null;

	return (
		<Box
			sx={{
				mt: 4,
				p: { xs: 3, md: 4 },
				border: '2px solid',
				borderColor: 'ink.main',
				bgcolor: 'background.paper',
			}}
		>
			<Box sx={{ mb: 2 }}>
				<Typography variant='h6' sx={{ fontSize: '1rem', fontWeight: 700, mb: 0.5 }}>
					Nie pasuje Ci żaden termin?
				</Typography>
				<Typography variant='body2' color='text.secondary'>
					Zapisz się na listę oczekujących — powiadomimy Cię, gdy pojawi się nowy termin tego
					szkolenia.
				</Typography>
			</Box>

			{error ? (
				<Alert severity='error' sx={{ borderRadius: 0, mb: 2 }}>
					{error}
				</Alert>
			) : null}

			<CourseWaitingListActions course={course} onError={setError} />
		</Box>
	);
};
