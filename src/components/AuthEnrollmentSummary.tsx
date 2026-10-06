'use client';

import { getCourseBySlug } from '@services/courses';
import { Box, Typography } from '@ui';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import 'dayjs/locale/pl';
import { useSearchParams } from 'next/navigation';
import { courseSlugFromRedirect } from '@/utils/paths';
import { formatPlnDisplay } from '@/utils/pricing';

dayjs.locale('pl');

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

	const price = formatPlnDisplay(date.customPrice ?? course.price);
	const when = `${dayjs(date.date).format('D MMMM')}, ${date.timeStart}`;

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
				Zapisujesz się na: {course.name}, {when}, {price}
			</Typography>
		</Box>
	);
};
