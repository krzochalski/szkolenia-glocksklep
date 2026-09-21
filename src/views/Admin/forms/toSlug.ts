export const toSlug = (val: string) =>
	val
		.toLowerCase()
		.replace(
			/[ąćęłńóśźż]/g,
			(c) =>
				({ ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z' })[c] ?? c
		)
		.replace(/[^a-z0-9\s-]/g, '')
		.trim()
		.replace(/\s+/g, '-');
