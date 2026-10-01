'use client';

import {
	HERO_CATALOGUE_IMAGES,
	THUMBNAIL_CATALOGUE_IMAGES,
	catalogueSelectOptions,
} from '@constants/catalogueImages';
import { Box, MenuItem, TextField } from '@ui';
import { useController, useFormContext } from 'react-hook-form';

const NONE_VALUE = '';

type CatalogueSelectProps = {
	readonly name: 'thumbnail' | 'hero';
	readonly label: string;
	readonly helperText: string;
	readonly catalogue: readonly string[];
};

const CatalogueSelect = ({ name, label, helperText, catalogue }: CatalogueSelectProps) => {
	const { control } = useFormContext();
	const { field, fieldState } = useController({ name, control });
	const value = typeof field.value === 'string' ? field.value : NONE_VALUE;
	const options = catalogueSelectOptions(catalogue, value);

	return (
		<TextField
			select
			label={label}
			fullWidth
			size='small'
			value={value}
			onChange={field.onChange}
			onBlur={field.onBlur}
			inputRef={field.ref}
			error={Boolean(fieldState.error)}
			helperText={fieldState.error?.message ?? helperText}
		>
			<MenuItem value={NONE_VALUE}>— brak —</MenuItem>
			{options.map((src) => (
				<MenuItem key={src} value={src}>
					{src}
				</MenuItem>
			))}
		</TextField>
	);
};

/** Optional hero + thumbnail pickers from public catalogues. */
export const CourseImageFields = () => (
	<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
		<CatalogueSelect
			name='thumbnail'
			label='Miniatura listy (opcjonalna)'
			helperText='Katalog /thumbnails — ikona na liście szkoleń'
			catalogue={THUMBNAIL_CATALOGUE_IMAGES}
		/>
		<CatalogueSelect
			name='hero'
			label='Hero strony (opcjonalne)'
			helperText='Katalog /hero — tło nagłówka na stronie szkolenia'
			catalogue={HERO_CATALOGUE_IMAGES}
		/>
	</Box>
);
