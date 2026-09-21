import type { Course } from '@/types/course';
import { fillPath } from '@/utils/paths';
import { Paths } from '@constants/paths';
import { Box, Button, HardShadow, Link, Typography } from '@ui';
import NextLink from 'next/link';

type PathStepProps = {
	readonly label: string;
	readonly courseSlug: string;
	readonly course?: Course;
	readonly showArrowBelow?: boolean;
};

export const PathStep = ({ label, courseSlug, course, showArrowBelow = false }: PathStepProps) => {
	const href = course ? fillPath(Paths.coursePage, { slug: course.slug }) : null;
	const hours = course?.hours;

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
			<HardShadow
				sx={{
					width: '100%',
					bgcolor: 'background.paper',
					p: 2.5,
				}}
			>
				{href ? (
					<Link
						component={NextLink}
						href={href}
						underline='hover'
						color='inherit'
						sx={{
							fontWeight: 700,
							fontSize: '1.05rem',
							display: 'block',
							mb: hours ? 0.5 : 1,
						}}
					>
						{label}
					</Link>
				) : (
					<Typography sx={{ fontWeight: 700, fontSize: '1.05rem', mb: hours ? 0.5 : 1 }}>
						{label}
					</Typography>
				)}
				{hours ? (
					<Typography
						sx={{
							fontFamily: '"Space Mono", monospace',
							fontSize: '0.75rem',
							color: 'text.secondary',
							mb: 1.5,
						}}
					>
						{hours}h
					</Typography>
				) : (
					<Box sx={{ mb: 1 }} />
				)}
				{href ? (
					<Button
						component={NextLink}
						href={href}
						variant='outlined'
						size='small'
						sx={{ textTransform: 'none' }}
					>
						Zobacz szkolenie
					</Button>
				) : (
					<Typography
						sx={{
							fontFamily: '"Space Mono", monospace',
							fontSize: '0.75rem',
							color: 'text.secondary',
						}}
					>
						{courseSlug}
					</Typography>
				)}
			</HardShadow>
			{showArrowBelow ? (
				<Box
					aria-hidden
					sx={{
						my: 1.5,
						width: 0,
						height: 0,
						borderLeft: '8px solid transparent',
						borderRight: '8px solid transparent',
						borderTop: '12px solid',
						borderTopColor: 'ink.main',
					}}
				/>
			) : null}
		</Box>
	);
};
