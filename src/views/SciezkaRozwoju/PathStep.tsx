'use client';

import { OptimizedImage } from '@components';
import type { Course } from '@/types/course';
import { resolveCourseThumbnailFrom } from '@/utils/courseImages';
import { fillPath } from '@/utils/paths';
import { Paths } from '@constants/paths';
import { Box, Button, Link, MonoText, PathStepCard, Typography } from '@ui';
import { CheckCircleIcon, GpsFixedOutlined } from '@ui/icons';
import NextLink from 'next/link';
import { useState } from 'react';

type PathStepProps = {
	readonly index: string;
	readonly label: string;
	readonly courseSlug: string;
	readonly course?: Course;
	readonly completed?: boolean;
};

const PATH_BADGE_SIZES = '(max-width: 600px) 64px, 80px';

const titleSx = {
	fontWeight: 700,
	fontSize: { xs: '1rem', sm: '1.0625rem' },
	lineHeight: 1.25,
	textTransform: 'uppercase',
	letterSpacing: '-0.01em',
	overflowWrap: 'anywhere',
} as const;

const PathStepBadge = ({ course, label }: { course?: Course; label: string }) => {
	const [imageFailed, setImageFailed] = useState(false);
	const imageSrc = resolveCourseThumbnailFrom(course, null);
	const showImage = Boolean(imageSrc) && !imageFailed;

	return (
		<Box
			sx={{
				width: { xs: 64, sm: 80 },
				height: { xs: 64, sm: 80 },
				borderRadius: '50%',
				border: '2px solid',
				borderColor: 'ink.main',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				overflow: 'hidden',
				bgcolor: 'surface.muted',
				flexShrink: 0,
			}}
		>
			{showImage && imageSrc ? (
				<OptimizedImage
					src={imageSrc}
					alt={label}
					loading='lazy'
					sizes={PATH_BADGE_SIZES}
					onError={() => setImageFailed(true)}
					sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
				/>
			) : (
				<GpsFixedOutlined
					sx={{ fontSize: { xs: '1.5rem', sm: '2rem' }, color: 'text.secondary' }}
				/>
			)}
		</Box>
	);
};

export const PathStep = ({
	index,
	label,
	courseSlug,
	course,
	completed = false,
}: PathStepProps) => {
	const href = course ? fillPath(Paths.coursePage, { slug: course.slug }) : null;
	const hours = course?.hours;

	const title = href ? (
		<Link
			component={NextLink}
			href={href}
			underline='hover'
			color='inherit'
			sx={{ ...titleSx, display: 'block' }}
		>
			{label}
		</Link>
	) : (
		<Typography sx={titleSx}>{label}</Typography>
	);

	const meta = (
		<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
			{hours ? (
				<MonoText sx={{ fontSize: '0.75rem', color: 'text.secondary', letterSpacing: '0.06em' }}>
					{hours}h
				</MonoText>
			) : null}
			{completed ? (
				<MonoText
					sx={{
						display: 'inline-flex',
						alignItems: 'center',
						gap: 0.5,
						fontSize: '0.75rem',
						color: 'primary.main',
						letterSpacing: '0.06em',
					}}
				>
					<CheckCircleIcon sx={{ fontSize: 14 }} aria-hidden />
					Ukończone
				</MonoText>
			) : null}
		</Box>
	);

	const action = completed ? (
		href ? (
			<Button
				component={NextLink}
				href={href}
				variant='text'
				size='small'
				sx={{
					textTransform: 'none',
					alignSelf: 'flex-start',
					fontWeight: 600,
					color: 'text.secondary',
				}}
			>
				Zobacz szkolenie
			</Button>
		) : null
	) : href ? (
		<Button
			component={NextLink}
			href={href}
			variant='outlined'
			size='small'
			sx={{
				textTransform: 'none',
				alignSelf: 'flex-start',
				fontWeight: 600,
			}}
		>
			Zobacz szkolenie
		</Button>
	) : (
		<MonoText sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{courseSlug}</MonoText>
	);

	return (
		<PathStepCard
			media={<PathStepBadge course={course} label={label} />}
			index={index}
			title={title}
			meta={meta}
			action={action}
			sx={completed ? { bgcolor: 'surface.muted' } : undefined}
		/>
	);
};
