'use client';

import { MenuItem, TextField } from '@ui';
import { useController, useFormContext } from 'react-hook-form';

type SelectOption = { value: string; label: string };

type FormSelectProps = {
	readonly name: string;
	readonly label: string;
	readonly options: SelectOption[];
	readonly onChange?: (value: string) => void;
};

export const FormSelect = ({ name, label, options, onChange }: FormSelectProps) => {
	const { control } = useFormContext();
	const { field, fieldState } = useController({ name, control });

	return (
		<TextField
			select
			label={label}
			fullWidth
			size='small'
			value={field.value ?? ''}
			onChange={(e) => {
				field.onChange(e);
				onChange?.(e.target.value);
			}}
			onBlur={field.onBlur}
			inputRef={field.ref}
			error={Boolean(fieldState.error)}
			helperText={fieldState.error?.message}
		>
			<MenuItem value='' disabled>
				— wybierz —
			</MenuItem>
			{options.map((opt) => (
				<MenuItem key={opt.value} value={opt.value}>
					{opt.label}
				</MenuItem>
			))}
		</TextField>
	);
};
