'use client';

import { Box, FormControlLabel, Switch, Typography } from '@ui';
import { useController, useFormContext } from 'react-hook-form';

/** Toggles `inactive` — when on, course is admin-only (no client enroll). */
export const CourseInactiveField = () => {
	const { control } = useFormContext();
	const { field } = useController({ name: 'inactive', control, defaultValue: false });

	return (
		<Box>
			<FormControlLabel
				control={
					<Switch
						checked={Boolean(field.value)}
						onChange={(_, checked) => field.onChange(checked)}
						onBlur={field.onBlur}
					/>
				}
				label='Nieaktywne'
			/>
			<Typography variant='caption' color='text.secondary' sx={{ display: 'block', ml: 0.5 }}>
				Widoczne tylko w panelu admina — klienci nie zobaczą oferty i nie mogą się zapisać.
			</Typography>
		</Box>
	);
};
