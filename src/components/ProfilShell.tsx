'use client';

import { Paths } from '@constants/paths';
import { useAuthUser } from '@hooks';
import { signOut } from '@services/auth';
import { withRedirectQuery } from '@/utils/paths';
import {
	Box,
	Button,
	ConfirmDialog,
	m,
	mobileStickyContentPb,
	motionTransition,
	Stack,
	Typography,
	useReducedMotion,
} from '@ui';
import {
	CalendarMonthIcon,
	EventAvailableIcon,
	HowToRegIcon,
	PersonOutlined,
} from '@ui/icons';
import NextLink from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
	type ReactNode,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from 'react';

const NAV = [
	{
		label: 'Profil',
		shortLabel: 'Profil',
		href: Paths.profil,
		exact: true,
		icon: PersonOutlined,
	},
	{
		label: 'Moje szkolenia',
		shortLabel: 'Szkolenia',
		href: Paths.mojeShkolenia,
		exact: false,
		icon: EventAvailableIcon,
	},
	{
		label: 'Harmonogram',
		shortLabel: 'Terminy',
		href: Paths.harmonogram,
		exact: false,
		icon: CalendarMonthIcon,
	},
	{
		label: 'Lista oczekujących',
		shortLabel: 'Oczekujące',
		href: Paths.listaOczekujacych,
		exact: true,
		icon: HowToRegIcon,
	},
] as const;

type ProfilShellProps = {
	readonly children: ReactNode;
};

const isNavActive = (pathname: string, item: (typeof NAV)[number]) =>
	item.exact
		? pathname === item.href
		: pathname === item.href || pathname.startsWith(`${item.href}/`);

export const ProfilShell = ({ children }: ProfilShellProps) => {
	const user = useAuthUser();
	const pathname = usePathname();
	const router = useRouter();
	const reduceMotion = useReducedMotion();
	const navRef = useRef<HTMLElement | null>(null);
	const [logoutOpen, setLogoutOpen] = useState(false);
	const [loggingOut, setLoggingOut] = useState(false);
	const [indicator, setIndicator] = useState({ y: 0, height: 0 });
	const [indicatorReady, setIndicatorReady] = useState(false);

	useEffect(() => {
		if (user) return;
		router.replace(withRedirectQuery(Paths.login, pathname || Paths.profil));
	}, [user, pathname, router]);

	useLayoutEffect(() => {
		const nav = navRef.current;
		if (!nav) return;

		const activeHref = NAV.find((item) => isNavActive(pathname, item))?.href;

		const measure = () => {
			const activeEl = activeHref
				? nav.querySelector<HTMLElement>(`a[href="${activeHref}"]`)
				: null;
			if (!activeEl) {
				setIndicatorReady(false);
				return;
			}
			setIndicator({ y: activeEl.offsetTop, height: activeEl.offsetHeight });
			setIndicatorReady(true);
		};

		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(nav);
		return () => ro.disconnect();
	}, [pathname]);

	if (!user) return null;

	const openLogout = () => setLogoutOpen(true);

	return (
		<Box sx={{ display: 'flex', gap: { md: 3 }, flex: 1, minHeight: 0 }}>
			<Box
				component='aside'
				sx={{
					width: 240,
					flexShrink: 0,
					borderRight: 1,
					borderColor: 'divider',
					pr: 2,
					display: { xs: 'none', md: 'flex' },
					flexDirection: 'column',
					gap: 1,
					bgcolor: 'background.paper',
					alignSelf: 'stretch',
				}}
			>
				<Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
					{user.displayName || 'Profil'}
				</Typography>
				<Typography variant='caption' color='text.secondary' sx={{ mb: 2 }}>
					{user.email}
				</Typography>
				<Stack
					ref={navRef}
					component='nav'
					spacing={1}
					sx={{ flex: 1, position: 'relative' }}
				>
					{indicatorReady ? (
						<Box
							component={m.div}
							aria-hidden
							initial={false}
							animate={{ y: indicator.y, height: indicator.height }}
							transition={reduceMotion ? { duration: 0 } : motionTransition.ui}
							sx={{
								position: 'absolute',
								left: 0,
								right: 0,
								top: 0,
								bgcolor: 'primary.main',
								zIndex: 0,
								pointerEvents: 'none',
							}}
						/>
					) : null}
					{NAV.map((item) => {
						const active = isNavActive(pathname, item);
						return (
							<Button
								key={item.href}
								component={NextLink}
								href={item.href}
								variant='outlined'
								fullWidth
								aria-current={active ? 'page' : undefined}
								sx={{
									position: 'relative',
									zIndex: 1,
									...(active
										? {
												color: 'primary.contrastText',
												borderColor: 'primary.main',
												bgcolor: 'transparent',
												'&:hover': {
													bgcolor: 'transparent',
													borderColor: 'primary.main',
													color: 'primary.contrastText',
												},
											}
										: {
												bgcolor: 'background.paper',
											}),
								}}
							>
								{item.label}
							</Button>
						);
					})}
				</Stack>
				<Button variant='contained' fullWidth onClick={openLogout}>
					Wyloguj
				</Button>
			</Box>
			<Box sx={{ flex: 1, minWidth: 0, pb: { xs: mobileStickyContentPb.xs, md: 0 } }}>
				{children}
			</Box>
			<Box
				component='nav'
				aria-label='Nawigacja profilu'
				sx={{
					display: { xs: 'flex', md: 'none' },
					position: 'fixed',
					left: 0,
					right: 0,
					bottom: 0,
					zIndex: 20,
					bgcolor: 'background.paper',
					borderTop: '3px solid',
					borderColor: 'ink.main',
					pt: 0.75,
					pb: 'max(8px, env(safe-area-inset-bottom))',
					px: 0.5,
					justifyContent: 'space-around',
					alignItems: 'stretch',
					gap: 0.25,
				}}
			>
				{NAV.map((item) => {
					const active = isNavActive(pathname, item);
					const Icon = item.icon;
					return (
						<Box
							key={item.href}
							component={NextLink}
							href={item.href}
							aria-label={item.label}
							aria-current={active ? 'page' : undefined}
							sx={{
								flex: 1,
								minWidth: 0,
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								justifyContent: 'center',
								gap: 0.25,
								py: 0.75,
								px: 0.5,
								textDecoration: 'none',
								color: active ? 'primary.main' : 'text.secondary',
								fontFamily: '"Space Grotesk", sans-serif',
								fontSize: '0.625rem',
								fontWeight: 700,
								letterSpacing: '0.04em',
								textTransform: 'uppercase',
								lineHeight: 1.2,
								textAlign: 'center',
								borderTop: '3px solid',
								borderColor: active ? 'primary.main' : 'transparent',
								mt: '-3px',
								'&:hover': {
									color: 'ink.main',
									bgcolor: 'surface.muted',
								},
							}}
						>
							<Icon sx={{ fontSize: 22 }} aria-hidden />
							<Box component='span' sx={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
								{item.shortLabel}
							</Box>
						</Box>
					);
				})}
			</Box>
			<ConfirmDialog
				open={logoutOpen}
				title='Potwierdź wylogowanie'
				cancelLabel='Anuluj'
				confirmLabel='Wyloguj'
				confirmColor='primary'
				loading={loggingOut}
				onCancel={() => setLogoutOpen(false)}
				onConfirm={() => {
					setLoggingOut(true);
					void signOut()
						.then(() => {
							setLogoutOpen(false);
							router.push(Paths.home);
						})
						.finally(() => setLoggingOut(false));
				}}
			>
				Czy na pewno chcesz się wylogować?
			</ConfirmDialog>
		</Box>
	);
};
