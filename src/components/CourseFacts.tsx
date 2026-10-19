'use client';

import { COURSE_LEVEL_LABEL, getCourseSlotsMax } from '@constants/courses';
import { getDevelopmentPath } from '@services/developmentPath';
import { Box, Chip, Stack, Typography } from '@ui';
import { useQuery } from '@tanstack/react-query';
import { CoursePathGraph } from '@/components/CoursePathGraph';
import { CoursePriceDisplay } from '@/components/CoursePriceDisplay';
import type { Course } from '@/types/course';
import { findCoursePathPlacement } from '@/utils/pathProgress';

const chipSx = {
	borderRadius: 0,
	fontFamily: '"Space Mono", monospace',
	fontWeight: 700,
	fontSize: '0.6875rem',
	letterSpacing: '0.04em',
	borderWidth: 2,
	borderColor: 'ink.main',
	height: 24,
} as const;

const factLabelSx = {
	fontFamily: '"Space Mono", monospace',
	fontSize: '0.625rem',
	fontWeight: 700,
	letterSpacing: '0.12em',
	textTransform: 'uppercase',
	color: 'text.secondary',
} as const;

export type CourseFactsMeta = {
	readonly price: number;
	readonly hours: number;
	readonly level: Course['level'];
	readonly tags?: string[];
	readonly slotsMax?: number;
	/** When set, looks up position on ścieżka rozwoju. */
	readonly courseSlug?: string;
};

type CourseFactsProps = {
	readonly meta: CourseFactsMeta;
};

export const CourseFacts = ({ meta }: CourseFactsProps) => {
	const level = (COURSE_LEVEL_LABEL[meta.level] ?? meta.level).toUpperCase();
	const slotsMax = getCourseSlotsMax({ slotsMax: meta.slotsMax });
	const tags = meta.tags ?? [];

	const { data: pathDoc } = useQuery({
		queryKey: ['developmentPath'],
		queryFn: getDevelopmentPath,
		enabled: Boolean(meta.courseSlug),
	});

	const pathPlacement =
		meta.courseSlug && pathDoc
			? findCoursePathPlacement(pathDoc, meta.courseSlug)
			: null;

	return (
		<Stack spacing={2} sx={{ mt: 3 }}>
			<CoursePriceDisplay price={meta.price} />
			<Box
				sx={{
					display: 'flex',
					flexWrap: 'wrap',
					alignItems: 'flex-start',
					gap: { xs: 2, md: 3 },
					rowGap: 1.5,
				}}
			>
				<Fact label='Czas' value={`${meta.hours} h`} />
				{pathPlacement ? <CoursePathGraph placement={pathPlacement} /> : null}
				<Fact label='Maks. osób' value={String(slotsMax)} />
			</Box>
			<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
				<Chip label={level} size='small' variant='outlined' sx={chipSx} />
				{tags.map((tag) => (
					<Chip key={tag} label={tag} size='small' variant='outlined' sx={chipSx} />
				))}
			</Box>
		</Stack>
	);
};

const Fact = ({ label, value }: { label: string; value: string }) => (
	<Box>
		<Typography sx={factLabelSx}>{label}</Typography>
		<Typography sx={{ fontWeight: 700, fontSize: '1rem', mt: 0.25, lineHeight: 1.3 }}>
			{value}
		</Typography>
	</Box>
);
