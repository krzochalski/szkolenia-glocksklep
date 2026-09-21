'use client';

import { isCurrentPath, navigationItems } from '@constants/nav';
import { Paths } from '@constants/paths';
import { useAuthUser } from '@hooks';
import { signOut } from '@services/auth';
import { Box, brand } from '@ui';
import { CloseIcon } from '@ui/icons';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';

type MainMenuProps = {
	readonly onClose: () => void;
};

const itemSx = (active: boolean) =>
	({
		display: 'flex',
		alignItems: 'center',
		gap: 2,
		minHeight: 48,
		px: 2,
		py: 1.5,
		textDecoration: 'none',
		fontFamily: '"Space Grotesk", sans-serif',
		fontSize: '0.875rem',
		fontWeight: 700,
		letterSpacing: '0.1em',
		textTransform: 'uppercase',
		transition: 'background 0.15s, color 0.15s',
		color: active ? 'accentDark.main' : 'accentDark.warm',
		bgcolor: active ? 'surface.muted' : 'transparent',
		borderLeft: '4px solid',
		borderColor: active ? 'accentDark.main' : 'transparent',
		'&:hover': {
			bgcolor: 'surface.muted',
			color: 'ink.main',
		},
	}) as const;

export const MainMenu = ({ onClose }: MainMenuProps) => {
	const pathname = usePathname();
	const user = useAuthUser();

	return (
		<Box
			onClick={onClose}
			role='presentation'
			sx={{
				position: 'fixed',
				inset: 0,
				background: brand.inkOverlay,
				backdropFilter: 'blur(4px)',
				zIndex: (theme) => theme.zIndex.modal,
			}}
		>
			<Box
				component='aside'
				onClick={(e) => e.stopPropagation()}
				role='dialog'
				aria-label='Menu'
				sx={{
					height: '100%',
					width: 'min(320px, 100%)',
					bgcolor: 'background.paper',
					borderRight: '2px solid',
					borderColor: 'ink.main',
					display: 'flex',
					flexDirection: 'column',
					p: 3,
					boxShadow: `6px 0 0 0 ${brand.ink}`,
				}}
			>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						mb: 4,
						minHeight: 48,
					}}
				>
					<Box
						sx={{
							fontSize: '1.5rem',
							fontWeight: 900,
							letterSpacing: '-0.05em',
							color: 'accentDark.main',
							fontFamily: '"Space Grotesk", sans-serif',
							textTransform: 'uppercase',
						}}
					>
						MENU
					</Box>
					<Box
						component='button'
						type='button'
						onClick={onClose}
						aria-label='Zamknij nawigację'
						sx={{
							background: 'none',
							border: '2px solid transparent',
							cursor: 'pointer',
							color: 'accentDark.warm',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							width: 48,
							height: 48,
							p: 0,
							flexShrink: 0,
							'&:hover': {
								color: 'ink.main',
								borderColor: 'ink.main',
							},
						}}
					>
						<CloseIcon />
					</Box>
				</Box>

				<Box component='nav' sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
					{navigationItems.map(({ label, path }) => (
						<Box
							key={path}
							component={NextLink}
							href={path}
							onClick={onClose}
							sx={itemSx(isCurrentPath(pathname, path))}
						>
							{label}
						</Box>
					))}
					<Box
						component={NextLink}
						href={user ? Paths.profil : Paths.login}
						onClick={onClose}
						sx={itemSx(isCurrentPath(pathname, Paths.profil))}
					>
						{user ? 'Profil' : 'Zaloguj'}
					</Box>
					{user ? (
						<Box
							component='button'
							type='button'
							onClick={() => {
								void signOut();
								onClose();
							}}
							sx={{
								...itemSx(false),
								border: 'none',
								cursor: 'pointer',
								textAlign: 'left',
								font: 'inherit',
							}}
						>
							Wyloguj
						</Box>
					) : (
						<Box
							component={NextLink}
							href={Paths.register}
							onClick={onClose}
							sx={itemSx(isCurrentPath(pathname, Paths.register))}
						>
							Rejestracja
						</Box>
					)}
				</Box>
			</Box>
		</Box>
	);
};
