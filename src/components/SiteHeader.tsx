'use client';

import { isCurrentPath, navigationItems } from '@constants/nav';
import { Paths } from '@constants/paths';
import { AppBar, Box, IconButton, Toolbar, Typography } from '@ui';
import { MenuIcon, PersonOutlined } from '@ui/icons';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MainMenu } from './MainMenu';

const linkSx = (active: boolean) =>
	({
		fontFamily: '"Space Mono", monospace',
		fontSize: '0.875rem',
		fontWeight: 500,
		textDecoration: 'none',
		textTransform: 'uppercase',
		color: active ? 'primary.main' : 'text.secondary',
		borderBottom: active ? '2px solid' : '2px solid transparent',
		borderColor: active ? 'primary.main' : 'transparent',
		pb: 0.5,
		transition: 'color 0.2s, border-color 0.2s',
		'&:hover': {
			color: 'primary.main',
		},
		'&:active': {
			transform: 'translate(1px, 1px)',
		},
	}) as const;

export const SiteHeader = () => {
	const pathname = usePathname();
	const [menuOpen, setMenuOpen] = useState(false);

	useEffect(() => {
		if (!menuOpen) return;
		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setMenuOpen(false);
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [menuOpen]);

	return (
		<>
			<AppBar position='sticky' sx={{ '@media print': { display: 'none' } }}>
				<Toolbar
					disableGutters
					sx={{
						justifyContent: 'space-between',
						alignItems: 'center',
						px: { xs: 2, lg: 4 },
						minHeight: { xs: 56, md: 64 },
						height: { xs: 56, md: 64 },
						maxWidth: 'xl',
						width: '100%',
						mx: 'auto',
						boxSizing: 'border-box',
					}}
				>
					<Box
						component={NextLink}
						href={Paths.home}
						sx={{
							textDecoration: 'none',
							display: 'flex',
							alignItems: 'center',
							minHeight: 48,
						}}
					>
						<Typography
							component='span'
							sx={{
								fontFamily: '"Space Grotesk", sans-serif',
								fontSize: { xs: '1.25rem', md: '1.5rem' },
								fontWeight: 700,
								letterSpacing: '-0.02em',
								lineHeight: 1,
								color: 'primary.main',
								textTransform: 'uppercase',
							}}
						>
							GLOCKACCI
						</Typography>
					</Box>

					<Box
						component='nav'
						sx={{
							display: { xs: 'none', md: 'flex' },
							gap: 4,
							alignItems: 'center',
						}}
					>
						{navigationItems.map(({ label, path }) => (
							<Box
								key={path}
								component={NextLink}
								href={path}
								sx={linkSx(isCurrentPath(pathname, path))}
							>
								{label}
							</Box>
						))}
						<IconButton
							component={NextLink}
							href={Paths.profil}
							aria-label='Profil'
							sx={{ color: 'primary.main', width: 48, height: 48 }}
						>
							<PersonOutlined />
						</IconButton>
					</Box>

					<Box
						sx={{
							display: { xs: 'flex', md: 'none' },
							alignItems: 'center',
							mr: -1.5,
						}}
					>
						<IconButton
							component={NextLink}
							href={Paths.profil}
							aria-label='Profil'
							sx={{ color: 'primary.main', width: 48, height: 48 }}
						>
							<PersonOutlined />
						</IconButton>
						<IconButton
							color='inherit'
							aria-label='Otwórz nawigację'
							aria-expanded={menuOpen}
							onClick={() => setMenuOpen((open) => !open)}
							sx={{ color: 'primary.main', width: 48, height: 48 }}
						>
							<MenuIcon />
						</IconButton>
					</Box>
				</Toolbar>
			</AppBar>
			{menuOpen ? <MainMenu onClose={() => setMenuOpen(false)} /> : null}
		</>
	);
};
