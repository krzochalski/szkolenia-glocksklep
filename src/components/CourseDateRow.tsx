'use client';

import { CourseDateMeta } from '@components/CourseDateMeta';
import { Paths } from '@constants/paths';
import { Box, Link, Paper, Price, Stack, Typography } from '@ui';
import NextLink from 'next/link';
import type { ReactNode } from 'react';
import type { Course, CourseClass } from '@/types/course';
import { isCourseClassCanceled } from '@/utils/courseDates';
import { COURSE_KIND_LABEL, getCourseKind } from '@/utils/courseKind';
import { formatCourseDatePl } from '@/utils/formatEnrollment';
import { fillPath } from '@/utils/paths';
import { bruttoFromNetto } from '@/utils/pricing';

export type CourseDateRowProps = {
	readonly course: Pick<Course, 'name' | 'slug' | 'price' | 'kind'>;
	readonly date: CourseClass;
	/** Defaults to the public course page. Ignored when `showTitle` is false. */
	readonly titleHref?: string;
	/** When false, date/time is the primary heading (course detail rows). Default true. */
	readonly showTitle?: boolean;
	/** When true (default), appends `· wolne: N` (or odwołane) to the meta line. */
	readonly showSlots?: boolean;
	/** When true, includes instructor in the meta line. */
	readonly showInstructor?: boolean;
	readonly highlighted?: boolean;
	readonly action?: ReactNode;
	readonly id?: string;
};

export const CourseDateRow = ({
	course,
	date,
	titleHref,
	showTitle = true,
	showSlots = true,
	showInstructor = false,
	highlighted = false,
	action,
	id,
}: CourseDateRowProps) => {
	const href = titleHref ?? fillPath(Paths.coursePage, { slug: course.slug });
	const canceled = isCourseClassCanceled(date);
	const when = `${formatCourseDatePl(date.date)} · ${date.timeStart}`;
	const netto = date.customPrice ?? course.price;
	const kind = getCourseKind(course);

	return (
		<Paper
			id={id}
			variant='outlined'
			sx={{
				p: 2.5,
				borderWidth: 2,
				borderColor: highlighted ? 'primary.main' : 'ink.main',
				boxShadow: highlighted ? (theme) => `4px 4px 0 ${theme.palette.primary.main}` : undefined,
				bgcolor: canceled || highlighted ? 'surface.muted' : 'background.paper',
			}}
		>
			<Stack
				direction={{ xs: 'column', sm: 'row' }}
				spacing={2}
				sx={{
					alignItems: { xs: 'stretch', sm: 'center' },
					justifyContent: 'space-between',
				}}
			>
				<Stack spacing={0.5} sx={{ minWidth: 0, flex: 1 }}>
					{showTitle && kind === 'practice' ? (
						<Typography
							variant='caption'
							sx={{
								fontFamily: '"Space Mono", monospace',
								fontWeight: 700,
								letterSpacing: '0.12em',
								textTransform: 'uppercase',
								color: 'primary.main',
							}}
						>
							{COURSE_KIND_LABEL.practice}
						</Typography>
					) : null}
					{showTitle ? (
						<Link
							component={NextLink}
							href={href}
							underline='hover'
							variant='h6'
							sx={{ display: 'block' }}
						>
							{course.name}
						</Link>
					) : (
						<Typography sx={{ fontWeight: 700 }}>{when}</Typography>
					)}
					{date.subtitle?.trim() ? (
						<Typography
							variant='body2'
							component='p'
							sx={{
								m: 0,
								fontFamily: '"Space Mono", monospace',
								fontSize: '0.75rem',
								fontWeight: 700,
								letterSpacing: '0.04em',
								color: 'primary.main',
							}}
						>
							{date.subtitle.trim()}
						</Typography>
					) : null}
					<CourseDateMeta
						date={date.date}
						timeStart={date.timeStart}
						place={date.place}
						hideWhen={!showTitle}
						showSlots={showSlots}
						slotsSource={date}
						showInstructor={showInstructor}
						instructorName={date.instructor?.name}
					/>
					{!canceled ? (
						<Box
							sx={{
								mt: 0.75,
								pt: 0.75,
								borderTop: '1px solid',
								borderColor: 'divider',
							}}
						>
							<Price gross={bruttoFromNetto(netto)} net={netto} size='sm' />
						</Box>
					) : null}
				</Stack>
				{action ? (
					<Box sx={{ flexShrink: 0, alignSelf: { xs: 'stretch', sm: 'center' } }}>{action}</Box>
				) : null}
			</Stack>
		</Paper>
	);
};
