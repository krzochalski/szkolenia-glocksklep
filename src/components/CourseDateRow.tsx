'use client';

import { Paths } from '@constants/paths';
import { usePriceMode } from '@hooks';
import { Box, Link, Paper, PriceToggle, Stack, Typography } from '@ui';
import NextLink from 'next/link';
import type { ReactNode } from 'react';
import type { Course, CourseClass } from '@/types/course';
import { getSlotsLeft, isCourseClassCanceled } from '@/utils/courseDates';
import { formatCourseDatePl } from '@/utils/formatEnrollment';
import { fillPath } from '@/utils/paths';
import { formatPlnDisplay } from '@/utils/pricing';

export type CourseDateRowProps = {
	readonly course: Pick<Course, 'name' | 'slug' | 'price'>;
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
	const { mode, setMode } = usePriceMode();
	const href = titleHref ?? fillPath(Paths.coursePage, { slug: course.slug });
	const canceled = isCourseClassCanceled(date);
	const place = date.place?.name ?? '—';
	const when = `${formatCourseDatePl(date.date)} · ${date.timeStart}`;
	const priceLabel = formatPlnDisplay(date.customPrice ?? course.price, mode);

	const metaParts = showTitle
		? [when, place]
		: [place];

	if (showInstructor && date.instructor?.name) {
		metaParts.push(`instruktor: ${date.instructor.name}`);
	}
	if (showSlots) {
		metaParts.push(canceled ? 'odwołane' : `wolne: ${getSlotsLeft(date)}`);
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
					<Typography
						variant='body2'
						component='p'
						color='text.secondary'
						sx={{ m: 0, display: 'block' }}
					>
						{meta}
					</Typography>
					{!canceled ? (
						<Stack
							direction='row'
							spacing={1.5}
							sx={{
								mt: 0.75,
								pt: 0.75,
								borderTop: '1px solid',
								borderColor: 'divider',
								alignItems: 'center',
								justifyContent: 'space-between',
								flexWrap: 'wrap',
								gap: 1,
							}}
						>
							<Typography
								variant='body2'
								component='p'
								sx={{ m: 0, fontWeight: 600, display: 'block' }}
							>
								{priceLabel}
							</Typography>
							<PriceToggle mode={mode} onChange={setMode} />
						</Stack>
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
