'use client';

import {
	COURSE_LEVEL_LABEL,
	DEFAULT_COURSE_SLOTS_MAX,
	DEFAULT_COURSE_TIME_START,
} from '@constants/courses';
import { Box, Chip, Stack, Typography } from '@ui';
import { CoursePriceDisplay } from '@/components/CoursePriceDisplay';
import type { Course } from '@/types/course';

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
	/** When set, show real term values instead of course defaults. */
	readonly timeStart?: string;
	readonly slotsMax?: number;
};

type CourseFactsProps = {
	readonly meta: CourseFactsMeta;
};

export const CourseFacts = ({ meta }: CourseFactsProps) => {
	const level = (COURSE_LEVEL_LABEL[meta.level] ?? meta.level).toUpperCase();
	const timeStart = meta.timeStart ?? DEFAULT_COURSE_TIME_START;
	const slotsMax = meta.slotsMax ?? DEFAULT_COURSE_SLOTS_MAX;
	const tags = meta.tags ?? [];

	return (
		<Stack spacing={2} sx={{ mt: 3 }}>
			<CoursePriceDisplay price={meta.price} />
			<Box
				sx={{
					display: 'flex',
					flexWrap: 'wrap',
					gap: { xs: 2, md: 3 },
					rowGap: 1.5,
				}}
			>
				<Fact label='Czas' value={`${meta.hours} h`} />
				<Fact label='Start' value={timeStart} />
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
		<Typography sx={{ fontWeight: 700, fontSize: '1rem', mt: 0.25 }}>{value}</Typography>
	</Box>
);
