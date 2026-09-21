'use client';

import type { ChangeEvent } from 'react';
import { useEffect, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { FormTextField } from './FormTextField';
import { toSlug } from './toSlug';

type AutoSlugFieldProps = {
	readonly name: string;
	readonly label: string;
	readonly sourceName: string;
};

export const AutoSlugField = ({ name, label, sourceName }: AutoSlugFieldProps) => {
	const { setValue, getValues } = useFormContext();
	const sourceValue = useWatch({ name: sourceName });
	const [touched, setTouched] = useState(false);

	useEffect(() => {
		if (!touched) {
			setValue(name, toSlug(sourceValue ?? ''), { shouldValidate: false });
		}
	}, [sourceValue, name, touched, setValue]);

	return (
		<FormTextField
			name={name}
			label={label}
			placeholder='auto-generowany-slug'
			inputProps={{
				onChange: (e: ChangeEvent<HTMLInputElement>) => {
					setTouched(e.target.value !== toSlug(getValues(sourceName) ?? ''));
				},
			}}
		/>
	);
};

export const LEVEL_OPTIONS = [
	{ value: 'basic', label: 'Basic' },
	{ value: 'intermediate', label: 'Intermediate' },
	{ value: 'advanced', label: 'Advanced' },
] as const;
