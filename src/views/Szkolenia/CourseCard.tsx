'use client';

import { COURSE_LEVEL_LABEL } from '@constants/courses';
import { Paths } from '@constants/paths';
import { OptimizedImage } from '@components';
import { Box, Button, CatalogCard, Chip, Price, Typography } from '@ui';
import { ArrowForwardIcon, GpsFixedOutlined } from '@ui/icons';
import NextLink from 'next/link';
import { useState } from 'react';
import type { Course } from '@/types/course';
import { COURSE_KIND_LABEL, getCourseKind } from '@/utils/courseKind';
import { fillPath } from '@/utils/paths';
import { bruttoFromNetto } from '@/utils/pricing';

type CourseCardProps = {
	readonly course: Course;
	readonly imageSrc?: string;
	/** Resolved names of prerequisite courses (practice only). */
	readonly prerequisiteNames?: string[];
};

const LIST_THUMB_SIZES = '(max-width: 600px) 72px, 96px';

const detailsButtonSx = {
	bgcolor: 'primary.main',
	color: 'primary.contrastText',
	border: '2px solid',
	borderColor: 'primary.main',
	fontFamily: '"Space Mono", monospace',
	fontSize: '0.75rem',
	letterSpacing: '0.1em',
	textTransform: 'uppercase',
	'&:hover': {
		bgcolor: 'background.paper',
		color: 'primary.main',
	},
	'&:active': {
		transform: 'translate(2px, 2px)',
		boxShadow: 'none',
	},
} as const;

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

export const CourseCard = ({ course, imageSrc, prerequisiteNames = [] }: CourseCardProps) => {
	const [imageFailed, setImageFailed] = useState(false);
	const tags = course.tags ?? [];
	const kind = getCourseKind(course);
	const level = (COURSE_LEVEL_LABEL[course.level] ?? course.level).toUpperCase();
	const eyebrow =
		kind === 'practice' ? `${COURSE_KIND_LABEL.practice.toUpperCase()} · ${level}` : level;
	const showImage = Boolean(imageSrc) && !imageFailed;

	return (
		<CatalogCard
			layout='list'
			eyebrow={eyebrow}
			image={
				showImage && imageSrc ? (
					<OptimizedImage
						src={imageSrc}
						alt={course.name}
						loading='lazy'
						sizes={LIST_THUMB_SIZES}
						onError={() => setImageFailed(true)}
						sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
					/>
				) : (
					<GpsFixedOutlined sx={{ fontSize: { xs: '1.75rem', sm: '2.5rem' }, color: 'text.secondary' }} />
				)
			}
			title={course.name}
			description={
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mt: 0.25 }}>
					{prerequisiteNames.length > 0 ? (
						<Typography
							sx={{
								fontFamily: '"Space Mono", monospace',
								fontSize: '0.6875rem',
								letterSpacing: '0.02em',
								color: 'text.secondary',
								lineHeight: 1.4,
							}}
						>
							Wymaga ukończenia: {prerequisiteNames.join(', ')}
						</Typography>
					) : null}
					<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
						<Chip label={`${course.hours} H`} size='small' variant='outlined' sx={chipSx} />
						{tags.map((tag) => (
							<Chip key={tag} label={tag} size='small' variant='outlined' sx={chipSx} />
						))}
					</Box>
				</Box>
			}
			price={<Price gross={bruttoFromNetto(course.price)} net={course.price} size='md' />}
			action={
				<Button
					component={NextLink}
					href={fillPath(Paths.coursePage, { slug: course.slug })}
					variant='contained'
					fullWidth
					endIcon={<ArrowForwardIcon sx={{ fontSize: '0.875rem' }} />}
					sx={detailsButtonSx}
				>
					Szczegóły
				</Button>
			}
		/>
	);
};
