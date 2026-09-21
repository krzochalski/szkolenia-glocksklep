'use client';

import { TextField } from '@ui';
import { Controller, useFormContext } from 'react-hook-form';

type FormTimePickerProps = {
	readonly name: string;
	readonly label: string;
};

export const FormTimePicker = ({ name, label }: FormTimePickerProps) => {
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
					type='time'
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
