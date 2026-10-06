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
	motionTransition,
	Stack,
	Typography,
	useReducedMotion,
} from '@ui';
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
	{ label: 'Profil', href: Paths.profil, exact: true },
	{ label: 'Moje szkolenia', href: Paths.mojeShkolenia, exact: false },
	{ label: 'Harmonogram', href: Paths.harmonogram, exact: false },
	{ label: 'Lista oczekujących', href: Paths.listaOczekujacych, exact: true },
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
				<Button variant='contained' fullWidth onClick={() => setLogoutOpen(true)}>
					Wyloguj
				</Button>
			</Box>
			<Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
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
