'use client';

import { getTags } from '@services/tags';
import type { Tag } from '@/types/course';
import { type CourseFormValues, courseSchema } from '@/utils/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import {
	Alert,
	Autocomplete,
	Box,
	Button,
	Divider,
	Paper,
	TextField,
} from '@ui';
import { useEffect, useState } from 'react';
import { FormProvider, type Resolver, useForm } from 'react-hook-form';
import { AutoSlugField, LEVEL_OPTIONS } from './AutoSlugField';
import { DatesSection } from './DatesSection';
import { FormSelect } from './FormSelect';
import { FormTextField } from './FormTextField';
import { SectionTitle } from './SectionTitle';

type CourseFormProps = {
	readonly defaultValues?: Partial<CourseFormValues>;
	readonly onSubmit: (data: CourseFormValues) => Promise<void>;
	readonly submitLabel?: string;
	readonly isAdmin?: boolean;
};

export const CourseForm = ({
	defaultValues,
	onSubmit,
	submitLabel = 'ZAPISZ',
	isAdmin = true,
}: CourseFormProps) => {
	const methods = useForm<CourseFormValues>({
		resolver: zodResolver(courseSchema) as Resolver<CourseFormValues>,
		defaultValues: { dates: [], tags: [], ...defaultValues },
	});
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [tags, setTags] = useState<Tag[]>([]);

	useEffect(() => {
		void getTags().then(setTags);
	}, []);

	const handleSubmit = async (data: CourseFormValues) => {
		setError(null);
		setSuccess(false);
		try {
			await onSubmit(data);
			setSuccess(true);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Błąd zapisu.');
		}
	};

	const tagOptions = tags.map((t) => t.name);
	const selectedTags: string[] = methods.watch('tags') ?? [];

	return (
		<Paper variant='outlined' sx={{ p: 3 }}>
			<FormProvider {...methods}>
				<Box
					component='form'
					autoComplete='off'
					onSubmit={methods.handleSubmit(handleSubmit)}
					sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}
				>
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
						<SectionTitle>Podstawowe informacje</SectionTitle>
						<Box
							sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}
						>
							<FormTextField name='name' label='Nazwa szkolenia' placeholder='Nazwa' />
							<AutoSlugField name='slug' label='Slug' sourceName='name' />
						</Box>
						<FormTextField
							name='description'
							label='Opis'
							placeholder='Krótki opis szkolenia...'
							multiline
							minRows={3}
						/>
						<Box
							sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}
						>
							<FormSelect name='level' label='Poziom' options={[...LEVEL_OPTIONS]} />
							<Autocomplete
								multiple
								options={tagOptions}
								value={selectedTags}
								onChange={(_, val) => methods.setValue('tags', val)}
								renderInput={(params) => (
									<TextField {...params} label='Tagi' placeholder='Wybierz tagi...' size='small' />
								)}
							/>
						</Box>
					</Box>

					<Divider />

					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
						<SectionTitle>Cena i czas trwania</SectionTitle>
						<Box
							sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}
						>
							<FormTextField name='price' label='Cena netto (PLN)' placeholder='1200' type='number' />
							<FormTextField name='hours' label='Czas trwania (h)' placeholder='8' type='number' />
						</Box>
					</Box>

					<Divider />

					<DatesSection isAdmin={isAdmin} />

					{error ? <Alert severity='error'>{error}</Alert> : null}
					{success ? <Alert severity='success'>Zapisano pomyślnie.</Alert> : null}

					<Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
						<Button type='submit' variant='contained' disabled={methods.formState.isSubmitting}>
							{submitLabel}
						</Button>
					</Box>
				</Box>
			</FormProvider>
		</Paper>
	);
};
