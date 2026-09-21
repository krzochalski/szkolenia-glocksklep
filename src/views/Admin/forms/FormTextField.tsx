'use client';

import { TextField } from '@ui';
import type { ChangeEvent } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

type FormTextFieldProps = {
	readonly name: string;
	readonly label: string;
	readonly placeholder?: string;
	readonly type?: string;
	readonly multiline?: boolean;
	readonly minRows?: number;
	readonly inputProps?: {
		onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
	};
};

export const FormTextField = ({
	name,
	label,
	placeholder,
	type,
	multiline,
	minRows,
	inputProps,
}: FormTextFieldProps) => {
	const { control } = useFormContext();

	return (
		<Controller
			name={name}
			control={control}
			render={({ field, fieldState: { error } }) => (
				<TextField
					{...field}
					value={field.value ?? ''}
					label={label}
					placeholder={placeholder}
					type={type}
					multiline={multiline}
					minRows={minRows}
					fullWidth
					size='small'
					error={Boolean(error)}
					helperText={error?.message}
					onChange={(e) => {
						field.onChange(e);
						inputProps?.onChange?.(e as ChangeEvent<HTMLInputElement>);
					}}
				/>
			)}
		/>
	);
};
