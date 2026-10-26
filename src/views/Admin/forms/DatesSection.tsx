'use client';

import { DEFAULT_COURSE_TIME_START, getCourseSlotsMax } from '@constants/courses';
import { getInstructors } from '@services/instructors';
import { getPlaces } from '@services/places';
import { Box, Button, ConfirmDialog, Typography } from '@ui';
import { Add } from '@ui/icons';
import { useEffect, useState } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import type { Instructor, Place } from '@/types/course';
import {
	defaultMinDecisionBy,
	getCourseMinDecisionDaysBefore,
	getCourseMinParticipants,
} from '@/utils/minParticipants';
import type { CourseFormValues } from '@/utils/schemas';
import { DateEntry } from './DateEntry';
import { SectionTitle } from './SectionTitle';

type DatesSectionProps = {
	readonly isAdmin?: boolean;
};

export const DatesSection = ({ isAdmin }: DatesSectionProps) => {
	const { control, formState, getValues } = useFormContext<CourseFormValues>();
	const { fields, append, remove, insert } = useFieldArray({ control, name: 'dates' });
	const courseSlotsMax = useWatch({ control, name: 'slotsMax' });
	const courseMinParticipants = useWatch({ control, name: 'minParticipants' });
	const courseMinDecisionDaysBefore = useWatch({ control, name: 'minDecisionDaysBefore' });
	const courseKind = useWatch({ control, name: 'kind' });
	const [places, setPlaces] = useState<Place[]>([]);
	const [instructors, setInstructors] = useState<Instructor[]>([]);
	const [toRemoveIndex, setToRemoveIndex] = useState<number | null>(null);

	useEffect(() => {
		void getPlaces().then(setPlaces);
		void getInstructors().then(setInstructors);
	}, []);

	const addDate = () => {
		const minDefaults = {
			kind: courseKind,
			minParticipants: courseMinParticipants,
			minDecisionDaysBefore: courseMinDecisionDaysBefore,
			slotsMax: courseSlotsMax,
		};
		const minParticipants = getCourseMinParticipants(minDefaults);
		const daysBefore = getCourseMinDecisionDaysBefore(minDefaults);
		append({
			date: '',
			timeStart: DEFAULT_COURSE_TIME_START,
			slotsMax: getCourseSlotsMax({ slotsMax: courseSlotsMax }),
			minParticipants,
			minDecisionBy: defaultMinDecisionBy(
				new Date().toISOString().slice(0, 10),
				daysBefore
			),
			subtitle: '',
			instructor: { name: '', slug: '' },
			place: { name: '', googleMapsLink: '', link: '' },
		});
	};

	const cloneDate = (index: number) => {
		const source = getValues(`dates.${index}`);
		insert(index + 1, { ...source });
	};

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<SectionTitle>Terminy (opcjonalnie)</SectionTitle>
				<Button size='small' startIcon={<Add />} onClick={addDate}>
					Dodaj termin
				</Button>
			</Box>

			<Typography variant='body2' color='text.secondary'>
				Każdy termin to osobna edycja szkolenia z własną datą, instruktorem i miejscem.
			</Typography>

			{fields.length === 0 ? (
				<Typography variant='body2' color='text.secondary' sx={{ py: 2, textAlign: 'center' }}>
					Brak terminów — kliknij &quot;Dodaj termin&quot;
				</Typography>
			) : null}

			{fields.map((field, index) => (
				<DateEntry
					key={field.id}
					index={index}
					onRemove={() => setToRemoveIndex(index)}
					onClone={() => cloneDate(index)}
					isAdmin={isAdmin}
					places={places}
					instructors={instructors}
				/>
			))}

			{formState.errors.dates?.message ? (
				<Typography variant='body2' color='error'>
					{formState.errors.dates.message}
				</Typography>
			) : null}

			<ConfirmDialog
				open={toRemoveIndex !== null}
				title='Potwierdź usunięcie'
				cancelLabel='Anuluj'
				confirmLabel='Usuń'
				onCancel={() => setToRemoveIndex(null)}
				onConfirm={() => {
					if (toRemoveIndex !== null) remove(toRemoveIndex);
					setToRemoveIndex(null);
				}}
			>
				<Typography>
					Czy na pewno chcesz usunąć termin #{(toRemoveIndex ?? 0) + 1} z formularza?
				</Typography>
			</ConfirmDialog>
		</Box>
	);
};
