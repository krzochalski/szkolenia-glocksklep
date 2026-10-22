'use client';

import { Box, Chip, Typography } from '@ui';
import type { CourseRequirements } from '@/types/courseDescription';
import { SectionLabel } from './SectionLabel';

type CourseRequirementsStripProps = {
	readonly requirements: CourseRequirements;
};

const chipSx = {
	fontFamily: '"Space Mono", monospace',
	fontSize: '0.75rem',
	letterSpacing: '0.04em',
	textTransform: 'uppercase' as const,
	borderRadius: 0,
	borderWidth: 2,
};

export const CourseRequirementsStrip = ({ requirements }: CourseRequirementsStripProps) => {
	const chips: string[] = [];
	if (requirements.ownGun) chips.push('Własna broń');
	if (requirements.holster) chips.push('Kabura');
	if (typeof requirements.roundCount === 'number' && requirements.roundCount > 0) {
		chips.push(`~${requirements.roundCount} naboi`);
	}
	if (chips.length === 0) return null;

	return (
		<Box sx={{ mb: 6 }}>
			<SectionLabel>Wymagania</SectionLabel>
			<Typography variant='h2' sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, mb: 2 }}>
				Co musisz mieć
			</Typography>
			<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
				{chips.map((label) => (
					<Chip key={label} label={label} size='small' variant='outlined' sx={chipSx} />
				))}
			</Box>
		</Box>
	);
};
