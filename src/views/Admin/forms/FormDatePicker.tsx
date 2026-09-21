'use client';

import { TextField } from '@ui';
import { Controller, useFormContext } from 'react-hook-form';

type FormDatePickerProps = {
	readonly name: string;
	readonly label: string;
};

export const FormDatePicker = ({ name, label }: FormDatePickerProps) => {
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
					type='date'
					fullWidth
					size='small'
					error={Boolean(error)}
					helperText={error?.message}
					slotProps={{ inputLabel: { shrink: true } }}
				/>
			)}
		/>
	);
};
