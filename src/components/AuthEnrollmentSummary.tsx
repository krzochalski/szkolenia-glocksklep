'use client';

import { getCourseBySlug } from '@services/courses';
import { Box, Typography } from '@ui';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { formatBookingSummary } from '@/utils/formatEnrollment';
import { courseSlugFromRedirect } from '@/utils/paths';

/** Compact “Zapisujesz się na…” banner when auth was entered from a course date. */
export const AuthEnrollmentSummary = () => {
	const searchParams = useSearchParams();
	const redirect = searchParams.get('redirect');
	const termin = searchParams.get('termin');
	const slug = courseSlugFromRedirect(redirect);

	const { data: course } = useQuery({
		queryKey: ['course', slug],
		queryFn: () => getCourseBySlug(slug as string),
		enabled: Boolean(slug && termin),
	});

	if (!slug || !termin || !course) return null;

	const date = course.dates?.find((d) => d.id === termin);
	if (!date) return null;

	const summary = formatBookingSummary({
		name: course.name,
		date: date.date,
		timeStart: date.timeStart,
		place: date.place?.name,
		price: date.customPrice ?? course.price,
	});

	return (
		<Box
			sx={{
				mb: 2,
				p: 2,
				border: '2px solid',
				borderColor: 'ink.main',
				bgcolor: 'surface.muted',
			}}
		>
			<Typography variant='body2' sx={{ fontWeight: 600 }}>
				Zapisujesz się na: {summary}
			</Typography>
		</Box>
	);
};
