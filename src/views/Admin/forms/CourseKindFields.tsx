'use client';

import { getCourses } from '@services/courses';
import type { Course } from '@/types/course';
import { COURSE_KIND_OPTIONS, getCourseKind } from '@/utils/courseKind';
import { Autocomplete, Box, TextField, Typography } from '@ui';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { FormSelect } from './FormSelect';

type CourseKindFieldsProps = {
	/** When editing, exclude this course from the prerequisite list. */
	readonly excludeCourseId?: string;
};

export const CourseKindFields = ({ excludeCourseId }: CourseKindFieldsProps) => {
	const { control, setValue } = useFormContext();
	const kind = useWatch({ control, name: 'kind' }) as string | undefined;
	const selectedIds = (useWatch({ control, name: 'prerequisiteCourseIds' }) as string[] | undefined) ?? [];
	const isPractice = getCourseKind({ kind: kind === 'practice' ? 'practice' : 'course' }) === 'practice';

	const { data: courses = [] } = useQuery({
		queryKey: ['courses'],
		queryFn: getCourses,
	});

	const prerequisiteOptions = useMemo(() => {
		return courses.filter(
			(c) =>
				getCourseKind(c) === 'course' &&
				c.id !== excludeCourseId &&
				!c.inactive
		);
	}, [courses, excludeCourseId]);

	const selectedCourses = useMemo(() => {
		const byId = new Map(courses.map((c) => [c.id, c]));
		return selectedIds.map((id) => byId.get(id)).filter((c): c is Course => Boolean(c));
	}, [courses, selectedIds]);

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
			<FormSelect
				name='kind'
				label='Rodzaj'
				options={[...COURSE_KIND_OPTIONS]}
				onChange={(value) => {
					if (value !== 'practice') {
						setValue('prerequisiteCourseIds', []);
					}
				}}
			/>
			{isPractice ? (
				<>
					<Autocomplete
						multiple
						options={prerequisiteOptions}
						getOptionLabel={(c) => c.name}
						isOptionEqualToValue={(a, b) => a.id === b.id}
						value={selectedCourses}
						onChange={(_, val) => setValue('prerequisiteCourseIds', val.map((c) => c.id))}
						renderInput={(params) => (
							<TextField
								{...params}
								label='Wymagane ukończone szkolenia'
								size='small'
								placeholder='Wybierz szkolenia…'
								helperText='Puste = trening otwarty dla wszystkich. W przeciwnym razie zapis tylko po ukończeniu wszystkich wybranych.'
							/>
						)}
					/>
					{prerequisiteOptions.length === 0 ? (
						<Typography variant='caption' color='text.secondary'>
							Brak aktywnych szkoleń (rodzaj: Szkolenie) do wybrania jako wymaganie.
						</Typography>
					) : null}
				</>
			) : null}
		</Box>
	);
};
