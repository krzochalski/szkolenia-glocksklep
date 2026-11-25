'use client';

import { Box, Link, Typography } from '@ui';
import NextLink from 'next/link';

export type BreadcrumbItem = { readonly name: string; readonly path: string };

type BreadcrumbsNavProps = {
	readonly items: readonly BreadcrumbItem[];
};

export const BreadcrumbsNav = ({ items }: BreadcrumbsNavProps) => (
	<Box
		component='nav'
		aria-label='Ścieżka nawigacji'
		sx={{ mb: 2, fontFamily: '"Space Mono", monospace', fontSize: '0.75rem' }}
	>
		<Box component='ol' sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, m: 0, p: 0, listStyle: 'none' }}>
			{items.map((item, index) => {
				const isLast = index === items.length - 1;
				return (
					<Box component='li' key={item.path} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
						{index > 0 ? (
							<Typography component='span' color='text.secondary' aria-hidden>
								/
							</Typography>
						) : null}
						{isLast ? (
							<Typography component='span' sx={{ fontWeight: 700 }}>
								{item.name}
							</Typography>
						) : (
							<Link
								component={NextLink}
								href={item.path}
								underline='hover'
								color='text.secondary'
								sx={{ fontSize: 'inherit', fontFamily: 'inherit' }}
							>
								{item.name}
							</Link>
						)}
					</Box>
				);
			})}
		</Box>
	</Box>
);