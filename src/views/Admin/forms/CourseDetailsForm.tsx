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
	Typography,
} from '@ui';
import { useEffect, useState } from 'react';
import { FormProvider, type Resolver, useForm } from 'react-hook-form';
import { AutoSlugField, LEVEL_OPTIONS } from './AutoSlugField';
import { FormSelect } from './FormSelect';
import { FormTextField } from './FormTextField';
import { SectionTitle } from './SectionTitle';

type CourseDetailsFormProps = {
	readonly defaultValues?: Partial<CourseFormValues>;
	readonly onSubmit: (data: CourseFormValues) => Promise<void>;
	readonly submitLabel?: string;
};

export const CourseDetailsForm = ({
	defaultValues,
	onSubmit,
	submitLabel = 'ZAPISZ',
}: CourseDetailsFormProps) => {
	const methods = useForm<CourseFormValues>({
		resolver: zodResolver(courseSchema) as Resolver<CourseFormValues>,
		defaultValues: { tags: [], ...defaultValues, dates: [] },
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
			await onSubmit({ ...data, dates: [] });
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
						<Typography variant='body2' color='text.secondary'>
							Zmiana slugu spowoduje, że stare linki przestaną działać. Terminy edytujesz osobno.
						</Typography>
						<Box
							sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}
						>
							<FormTextField name='name' label='Nazwa szkolenia' />
							<AutoSlugField name='slug' label='Slug' sourceName='name' />
						</Box>
						<FormTextField name='description' label='Opis' multiline minRows={3} />
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
									<TextField {...params} label='Tagi' size='small' placeholder='Wybierz tagi...' />
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
							<FormTextField name='price' label='Cena netto (PLN)' type='number' />
							<FormTextField name='hours' label='Czas trwania (h)' type='number' />
						</Box>
					</Box>

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
