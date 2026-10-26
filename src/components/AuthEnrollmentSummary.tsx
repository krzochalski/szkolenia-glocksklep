'use client';

import { PlaceNameLink } from '@components/PlaceNameLink';
import { getCourseBySlug } from '@services/courses';
import { Box, Price, Typography } from '@ui';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { formatCourseDatePl } from '@/utils/formatEnrollment';
import { courseSlugFromRedirect } from '@/utils/paths';
import { bruttoFromNetto } from '@/utils/pricing';

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

	const netto = date.customPrice ?? course.price;

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
				Zapisujesz się na: {course.name}, {formatCourseDatePl(date.date)}, {date.timeStart},{' '}
				<PlaceNameLink place={date.place} />
			</Typography>
			<Price
				gross={bruttoFromNetto(netto)}
				net={netto}
				size='sm'
				sx={{ mt: 1, display: 'block' }}
			/>
		</Box>
	);
};
