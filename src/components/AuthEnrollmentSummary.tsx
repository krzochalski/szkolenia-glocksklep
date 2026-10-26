'use client';

import { CourseDateMeta } from '@components/CourseDateMeta';
import { getCourseBySlug } from '@services/courses';
import { useQuery } from '@tanstack/react-query';
import { Box, Price, Typography } from '@ui';
import { useSearchParams } from 'next/navigation';
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
			<Typography variant='body2' sx={{ fontWeight: 600, mb: 0.75 }}>
				Zapisujesz się na: {course.name}
			</Typography>
			<CourseDateMeta date={date.date} timeStart={date.timeStart} place={date.place} />
			<Price
				gross={bruttoFromNetto(netto)}
				net={netto}
				size='sm'
				sx={{ mt: 1, display: 'block' }}
			/>
		</Box>
	);
};
