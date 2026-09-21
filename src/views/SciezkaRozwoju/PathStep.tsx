import type { Course } from '@/types/course';
import { fillPath } from '@/utils/paths';
import { Paths } from '@constants/paths';
import { Button, Link, MonoText, PathStepCard, Typography } from '@ui';
import NextLink from 'next/link';

type PathStepProps = {
	readonly index: string;
	readonly label: string;
	readonly courseSlug: string;
	readonly course?: Course;
};

const titleSx = {
	fontWeight: 700,
	fontSize: { xs: '1rem', sm: '1.0625rem' },
	lineHeight: 1.25,
	textTransform: 'uppercase',
	letterSpacing: '-0.01em',
	overflowWrap: 'anywhere',
} as const;

export const PathStep = ({ index, label, courseSlug, course }: PathStepProps) => {
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

	const meta = hours ? (
		<MonoText sx={{ fontSize: '0.75rem', color: 'text.secondary', letterSpacing: '0.06em' }}>
			{hours}h
		</MonoText>
	) : null;

	const action = href ? (
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

	return <PathStepCard index={index} title={title} meta={meta} action={action} />;
};
