'use client';

import { CourseWaitingListActions } from '@/components/CourseWaitingListActions';
import { WAITLIST_SECTION_ID } from '@constants/waitlist';
import { useAuthUser } from '@hooks';
import type { Course, CourseClass } from '@/types/course';
import { formatWaitingListDemand } from '@/utils/courseDates';
import { Box, HardShadow, MotionAlert, Typography } from '@ui';
import { CalendarMonthIcon } from '@ui/icons';
import { useEffect, useState } from 'react';

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
	const noUpcomingDates = futureDates.length === 0;
	const waitingCount = course.waitingListCount ?? 0;
	const demandLabel =
		noUpcomingDates && waitingCount > 0 ? formatWaitingListDemand(waitingCount) : null;

	useEffect(() => {
		if (enrolled) return;
		if (typeof window === 'undefined') return;
		const scrollToWaitlist = () => {
			if (window.location.hash !== `#${WAITLIST_SECTION_ID}`) return;
			document
				.getElementById(WAITLIST_SECTION_ID)
				?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		};
		scrollToWaitlist();
		window.addEventListener('hashchange', scrollToWaitlist);
		return () => window.removeEventListener('hashchange', scrollToWaitlist);
	}, [enrolled]);

	if (enrolled) return null;

	const title = noUpcomingDates ? 'Brak terminów — zapisz się na listę' : 'Nie pasuje Ci żaden termin?';
	const description = noUpcomingDates
		? 'Powiadomimy Cię, gdy pojawi się nowy termin tego szkolenia.'
		: 'Zapisz się na listę oczekujących — powiadomimy Cię, gdy pojawi się nowy termin tego szkolenia.';

	return (
		<HardShadow
			id={WAITLIST_SECTION_ID}
			sx={{
				mt: 4,
				p: { xs: 3, md: 4 },
				bgcolor: noUpcomingDates ? 'accentDark.pale' : 'background.paper',
				scrollMarginTop: 96,
			}}
		>
			<Box
				sx={{
					mb: 2,
					display: 'flex',
					gap: 2,
					alignItems: 'flex-start',
				}}
			>
				{noUpcomingDates ? (
					<Box
						sx={{
							flexShrink: 0,
							width: 48,
							height: 48,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							bgcolor: 'primary.main',
							color: 'primary.contrastText',
						}}
						aria-hidden
					>
						<CalendarMonthIcon />
					</Box>
				) : null}
				<Box sx={{ minWidth: 0 }}>
					<Typography
						variant={noUpcomingDates ? 'h5' : 'h6'}
						component='h3'
						sx={{
							fontSize: noUpcomingDates ? undefined : '1rem',
							fontWeight: 700,
							mb: 0.5,
						}}
					>
						{title}
					</Typography>
					<Typography variant='body2' color='text.secondary'>
						{description}
					</Typography>
					{demandLabel ? (
						<Typography
							variant='body2'
							sx={{ mt: 1, fontWeight: 700, color: 'primary.main' }}
						>
							{demandLabel}
						</Typography>
					) : null}
				</Box>
			</Box>

			<MotionAlert show={Boolean(error)} severity='error' sx={{ borderRadius: 0, mb: 2 }}>
				{error}
			</MotionAlert>

			<CourseWaitingListActions
				course={course}
				onError={setError}
				onSuccess={() => setError(null)}
			/>
		</HardShadow>
	);
};
