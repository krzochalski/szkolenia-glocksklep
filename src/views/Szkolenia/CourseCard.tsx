'use client';

import { COURSE_LEVEL_LABEL } from '@constants/courses';
import { Paths } from '@constants/paths';
import { Box, Button, CatalogCard, Chip, type PriceMode, PriceToggle } from '@ui';
import { ArrowForwardIcon, GpsFixedOutlined } from '@ui/icons';
import NextLink from 'next/link';
import { useState } from 'react';
import type { Course } from '@/types/course';
import { fillPath } from '@/utils/paths';
import { formatCoursePrice } from '@/utils/pricing';

type CourseCardProps = {
	readonly course: Course;
	readonly imageSrc?: string;
};

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

export const CourseCard = ({ course, imageSrc }: CourseCardProps) => {
	const [priceMode, setPriceMode] = useState<PriceMode>('netto');
	const [imageFailed, setImageFailed] = useState(false);
	const tags = course.tags ?? [];
	const level = (COURSE_LEVEL_LABEL[course.level] ?? course.level).toUpperCase();
	const showImage = Boolean(imageSrc) && !imageFailed;

	return (
		<CatalogCard
			layout='list'
			eyebrow={level}
			image={
				showImage ? (
					<Box
						component='img'
						src={imageSrc}
						alt={course.name}
						loading='lazy'
						decoding='async'
						onError={() => setImageFailed(true)}
						sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
					/>
				) : (
					<GpsFixedOutlined sx={{ fontSize: { xs: '1.75rem', sm: '2.5rem' }, color: 'text.secondary' }} />
				)
			}
			title={course.name}
			description={
				<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 0.25 }}>
					<Chip label={`${course.hours} H`} size='small' variant='outlined' sx={chipSx} />
					{tags.map((tag) => (
						<Chip key={tag} label={tag} size='small' variant='outlined' sx={chipSx} />
					))}
				</Box>
			}
			price={formatCoursePrice(course.price, priceMode)}
			priceToggle={<PriceToggle mode={priceMode} onChange={setPriceMode} />}
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
