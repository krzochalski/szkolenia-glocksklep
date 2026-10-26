'use client';

import { PlaceNameLink } from '@components/PlaceNameLink';
import { type BoxProps, Stack, Typography } from '@ui';
import type { Course, CourseClass, Place } from '@/types/course';
import { warsawToday } from '@/utils/adminDashboard';
import { formatSlotsMeta, isCourseClassCanceled } from '@/utils/courseDates';
import { formatCourseDatePl } from '@/utils/formatEnrollment';
import {
	formatPublicMinParticipantsHint,
	type CourseMinDefaults,
} from '@/utils/minParticipants';

export type CourseDateMetaProps = {
	readonly date: string;
	readonly timeStart: string;
	readonly place?: Pick<Place, 'name' | 'googleMapsLink' | 'link'> | null;
	readonly showSlots?: boolean;
	readonly slotsSource?: Pick<CourseClass, 'slotsMax' | 'participants' | 'canceled' | 'minParticipants'> & {
		readonly date?: string;
	};
	/** Course defaults for public min soft-copy (optional). */
	readonly courseMin?: CourseMinDefaults | Pick<Course, 'kind' | 'minParticipants' | 'slotsMax'> | null;
	readonly showInstructor?: boolean;
	readonly instructorName?: string;
	/** When true, omit date+time line (course detail rows already show it as heading). */
	readonly hideWhen?: boolean;
	readonly sx?: BoxProps['sx'];
};

/** Stacked client session meta: date/time, place, optional slots/instructor / min hint. */
export const CourseDateMeta = ({
	date,
	timeStart,
	place,
	showSlots = false,
	slotsSource,
	courseMin,
	showInstructor = false,
	instructorName,
	hideWhen = false,
	sx,
}: CourseDateMetaProps) => {
	const canceled = slotsSource ? isCourseClassCanceled(slotsSource) : false;
	const instructor = instructorName?.trim();
	const slotsLine =
		showSlots && slotsSource ? (canceled ? 'odwołane' : formatSlotsMeta(slotsSource)) : null;
	const instructorLine = showInstructor && instructor ? `instruktor: ${instructor}` : null;
	const minHint =
		showSlots && slotsSource && !canceled
			? formatPublicMinParticipantsHint(
					courseMin ?? null,
					{ ...slotsSource, date: slotsSource.date ?? date },
					warsawToday()
				)
			: null;

	return (
		<Stack spacing={0.25} sx={[{ minWidth: 0 }, ...(sx ? (Array.isArray(sx) ? sx : [sx]) : [])]}>
			{hideWhen ? null : (
				<Typography variant='body2' color='text.secondary' component='p' sx={{ m: 0 }}>
					{formatCourseDatePl(date)} · {timeStart}
				</Typography>
			)}
			{place ? (
				<Typography variant='body2' component='p' sx={{ m: 0 }}>
					<PlaceNameLink place={place} />
				</Typography>
			) : null}
			{instructorLine || slotsLine ? (
				<Typography variant='body2' color='text.secondary' component='p' sx={{ m: 0 }}>
					{[instructorLine, slotsLine].filter(Boolean).join(' · ')}
				</Typography>
			) : null}
			{minHint ? (
				<Typography variant='body2' color='text.secondary' component='p' sx={{ m: 0 }}>
					{minHint}
				</Typography>
			) : null}
		</Stack>
	);
};
