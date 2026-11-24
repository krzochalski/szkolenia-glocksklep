'use client';

import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core';
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { adminMainPaneSx } from '@components/adminResponsive';
import { ADMIN_NAV, type AdminNavItem, Paths } from '@constants';
import { useAuthUser } from '@hooks';
import { getAdminSettings, saveAdminMenuOrder, signOut } from '@services';
import { orderAdminNav } from '@/utils/adminMenuOrder';
import {
	Box,
	Button,
	ConfirmDialog,
	IconButton,
	Link,
	SiteNavDrawer,
	Stack,
	Tooltip,
	Typography,
} from '@ui';
import { DragHandle, MenuIcon } from '@ui/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode, useEffect, useMemo, useState } from 'react';

type AdminShellProps = {
	readonly children: ReactNode;
};

type SortableNavLinkProps = {
	readonly item: AdminNavItem;
	readonly active: boolean;
};

const SortableNavLink = ({ item, active }: SortableNavLinkProps) => {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: item.id,
	});

	return (
		<Box
			ref={setNodeRef}
			sx={{
				display: 'flex',
				alignItems: 'center',
				gap: 0.25,
				transform: CSS.Transform.toString(transform),
				transition,
				opacity: isDragging ? 0.6 : 1,
				borderRadius: 1,
				bgcolor: active ? 'action.selected' : 'transparent',
			}}
		>
			<Tooltip title='Przeciągnij, aby zmienić kolejność'>
				<IconButton
					size='small'
					{...attributes}
					{...listeners}
					aria-label={`Zmień kolejność: ${item.label}`}
					sx={{ cursor: 'grab', touchAction: 'none', flexShrink: 0, width: 44, height: 44 }}
				>
					<DragHandle fontSize='small' />
				</IconButton>
			</Tooltip>
			<Link
				component={NextLink}
				href={item.href}
				underline='none'
				sx={{
					flex: 1,
					px: 1,
					py: 1.25,
					borderRadius: 1,
					fontSize: '0.875rem',
					fontWeight: active ? 700 : 500,
					color: active ? 'primary.main' : 'text.secondary',
					minHeight: 44,
					display: 'flex',
					alignItems: 'center',
				}}
			>
				{item.label}
			</Link>
		</Box>
	);
};

export const AdminShell = ({ children }: AdminShellProps) => {
	const pathname = usePathname();
	const user = useAuthUser();
	const queryClient = useQueryClient();
	const [logoutOpen, setLogoutOpen] = useState(false);
	const [loggingOut, setLoggingOut] = useState(false);
	const [mobileNavOpen, setMobileNavOpen] = useState(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: close drawer after route change
	useEffect(() => {
		setMobileNavOpen(false);
	}, [pathname]);

	const settingsQueryKey = ['adminSettings', user?.uid] as const;

	const { data: menuOrder } = useQuery({
		queryKey: settingsQueryKey,
		queryFn: async () => {
			if (!user) return null;
			const settings = await getAdminSettings(user.uid);
			return settings.menuOrder ?? null;
		},
		enabled: Boolean(user?.uid),
	});

	const navItems = useMemo(() => orderAdminNav(ADMIN_NAV, menuOrder), [menuOrder]);

	const drawerLinks = useMemo(
		() =>
			navItems.map((item) => ({
				id: item.id,
				href: item.href,
				label: item.label,
				active: pathname === item.href || pathname.startsWith(`${item.href}/`),
			})),
		[navItems, pathname]
	);

	const persistOrder = useMutation({
		mutationFn: saveAdminMenuOrder,
		onMutate: async (nextOrder) => {
			await queryClient.cancelQueries({ queryKey: settingsQueryKey });
			const previous = queryClient.getQueryData<readonly string[] | null>(settingsQueryKey);
			queryClient.setQueryData(settingsQueryKey, nextOrder);
			return { previous };
		},
		onError: (_err, _next, context) => {
			if (context) queryClient.setQueryData(settingsQueryKey, context.previous);
		},
		onSettled: () => {
			void queryClient.invalidateQueries({ queryKey: settingsQueryKey });
		},
	});

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (!over || active.id === over.id) return;
		const oldIndex = navItems.findIndex((item) => item.id === active.id);
		const newIndex = navItems.findIndex((item) => item.id === over.id);
		if (oldIndex < 0 || newIndex < 0) return;
		const next = arrayMove(navItems, oldIndex, newIndex).map((item) => item.id);
		persistOrder.mutate(next);
	};

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				height: '100dvh',
				overflow: 'hidden',
				maxWidth: '100vw',
			}}
		>
			<Box
				sx={{
					display: { xs: 'flex', md: 'none' },
					alignItems: 'center',
					justifyContent: 'space-between',
					flexShrink: 0,
					gap: 1,
					px: 1.5,
					py: 1,
					borderBottom: 1,
					borderColor: 'divider',
					bgcolor: 'background.paper',
				}}
			>
				<Typography variant='subtitle1' sx={{ fontWeight: 700, minWidth: 0 }}>
					Admin
				</Typography>
				<IconButton
					aria-label='Otwórz menu admina'
					onClick={() => setMobileNavOpen(true)}
					sx={{ width: 44, height: 44 }}
				>
					<MenuIcon />
				</IconButton>
			</Box>

			<Box sx={{ display: 'flex', flex: 1, minHeight: 0, minWidth: 0 }}>
				<Box
					component='aside'
					sx={{
						width: 240,
						flexShrink: 0,
						borderRight: 1,
						borderColor: 'divider',
						p: 2,
						display: { xs: 'none', md: 'flex' },
						flexDirection: 'column',
						gap: 1,
						bgcolor: 'background.paper',
						overflow: 'auto',
					}}
				>
					<Typography variant='subtitle1' sx={{ mb: 1, fontWeight: 700 }}>
						Admin
					</Typography>
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragEnd={handleDragEnd}
					>
						<SortableContext
							items={navItems.map((item) => item.id)}
							strategy={verticalListSortingStrategy}
						>
							<Stack component='nav' spacing={0.5} sx={{ flex: 1 }} aria-label='Menu admina'>
								{navItems.map((item) => {
									const active =
										pathname === item.href || pathname.startsWith(`${item.href}/`);
									return <SortableNavLink key={item.id} item={item} active={active} />;
								})}
							</Stack>
						</SortableContext>
					</DndContext>
					<Button component={NextLink} href={Paths.home} size='small' variant='outlined' sx={{ minHeight: 44 }}>
						Strona główna
					</Button>
					<Button size='small' variant='text' onClick={() => setLogoutOpen(true)} sx={{ minHeight: 44 }}>
						Wyloguj
					</Button>
				</Box>
				<Box component='main' sx={{ ...adminMainPaneSx, p: { xs: 2, md: 3 } }}>
					{children}
				</Box>
			</Box>

			<SiteNavDrawer
				open={mobileNavOpen}
				onClose={() => setMobileNavOpen(false)}
				links={drawerLinks}
				linkComponent={NextLink}
				title='Admin'
				ariaLabel='Menu admina'
				navLabel='Sekcje panelu admina'
				footer={
					<Stack spacing={1} sx={{ '& .MuiButton-root': { minHeight: 44 } }}>
						<Button component={NextLink} href={Paths.home} variant='outlined' fullWidth>
							Strona główna
						</Button>
						<Button variant='text' fullWidth onClick={() => setLogoutOpen(true)}>
							Wyloguj
						</Button>
					</Stack>
				}
			/>

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
						.then(() => setLogoutOpen(false))
						.finally(() => setLoggingOut(false));
				}}
			>
				Czy na pewno chcesz się wylogować?
			</ConfirmDialog>
		</Box>
	);
};