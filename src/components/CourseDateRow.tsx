'use client';

import { Paths } from '@constants/paths';
import { Box, Link, Paper, Stack, Typography } from '@ui';
import NextLink from 'next/link';
import type { ReactNode } from 'react';
import type { Course, CourseClass } from '@/types/course';
import { formatSlotsMeta, isCourseClassCanceled } from '@/utils/courseDates';
import { COURSE_KIND_LABEL, getCourseKind } from '@/utils/courseKind';
import { formatCourseDatePl } from '@/utils/formatEnrollment';
import { fillPath } from '@/utils/paths';
import { formatPlnNettoBrutto } from '@/utils/pricing';

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
	const place = date.place?.name ?? '—';
	const when = `${formatCourseDatePl(date.date)} · ${date.timeStart}`;
	const priceLabel = formatPlnNettoBrutto(date.customPrice ?? course.price);
	const kind = getCourseKind(course);

	const metaParts = showTitle ? [when, place] : [place];

	if (showInstructor && date.instructor?.name) {
		metaParts.push(`instruktor: ${date.instructor.name}`);
	}
	if (showSlots) {
		metaParts.push(canceled ? 'odwołane' : formatSlotsMeta(date));
	}

	const meta = metaParts.join(' · ');

	return (
		<Paper
			id={id}
			variant='outlined'
			sx={{
				p: 2.5,
				borderWidth: 2,
				borderColor: highlighted ? 'primary.main' : 'ink.main',
				boxShadow: highlighted
					? (theme) => `4px 4px 0 ${theme.palette.primary.main}`
					: undefined,
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
					<Typography
						variant='body2'
						component='p'
						color='text.secondary'
						sx={{ m: 0, display: 'block' }}
					>
						{meta}
					</Typography>
					{!canceled ? (
						<Typography
							variant='body2'
							component='p'
							sx={{
								m: 0,
								mt: 0.75,
								pt: 0.75,
								borderTop: '1px solid',
								borderColor: 'divider',
								fontWeight: 600,
								display: 'block',
							}}
						>
							{priceLabel}
						</Typography>
					) : null}
				</Stack>
				{action ? (
					<Box sx={{ flexShrink: 0, alignSelf: { xs: 'stretch', sm: 'center' } }}>
						{action}
					</Box>
				) : null}
			</Stack>
		</Paper>
	);
};
