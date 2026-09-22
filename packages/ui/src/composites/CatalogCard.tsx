import type { ReactNode } from 'react';
import { Box, Chip, Typography } from '../primitives';
import { HardShadow, MonoText } from './HardShadow';

type CatalogCardProps = {
	readonly eyebrow?: ReactNode;
	readonly soldOutLabel?: ReactNode;
	readonly promo?: boolean;
	readonly promoLabel?: string;
	readonly image: ReactNode;
	readonly title: ReactNode;
	readonly description?: ReactNode;
	readonly price?: ReactNode;
	readonly priceToggle?: ReactNode;
	readonly action?: ReactNode;
	/** `tile` = square catalog card; `list` = dense horizontal row. */
	readonly layout?: 'tile' | 'list';
};

export const CatalogCard = ({
	eyebrow,
	soldOutLabel,
	promo = false,
	promoLabel = 'PROMO',
	image,
	title,
	description,
	price,
	priceToggle,
	action,
	layout = 'tile',
}: CatalogCardProps) => {
	const soldOut = soldOutLabel != null && soldOutLabel !== false;
	const showHeader = eyebrow != null && eyebrow !== false && eyebrow !== '';
	const emphasized = promo && !soldOut;
	const hasFooter = price != null || priceToggle != null || action != null;
	const isList = layout === 'list';

	const accentBorder = emphasized ? 'error.main' : soldOut ? 'text.secondary' : 'ink.main';

	const soldOutOverlay = soldOut ? (
		<Box
			sx={{
				position: 'absolute',
				left: '50%',
				top: '50%',
				transform: 'translate(-50%, -50%)',
				zIndex: 3,
				px: 1.5,
				py: 0.75,
				bgcolor: 'background.paper',
				border: '2px solid',
				borderColor: 'text.secondary',
				pointerEvents: 'none',
			}}
		>
			<Typography
				sx={{
					fontFamily: '"Space Mono", monospace',
					fontSize: '0.75rem',
					fontWeight: 700,
					letterSpacing: '0.12em',
					color: 'text.secondary',
					lineHeight: 1,
				}}
			>
				{soldOutLabel}
			</Typography>
		</Box>
	) : null;

	const promoBadge = emphasized ? (
		<Chip
			label={promoLabel}
			size='small'
			sx={{
				position: 'absolute',
				top: 8,
				right: 8,
				zIndex: 1,
				bgcolor: 'error.main',
				color: 'error.contrastText',
				fontFamily: '"Space Mono", monospace',
				fontWeight: 700,
				fontSize: '0.6875rem',
				letterSpacing: '0.08em',
				borderRadius: 0,
				height: 24,
			}}
		/>
	) : null;

	const titleBlock = (
		<Box sx={{ minWidth: 0 }}>
			{isList && showHeader && (
				<Typography
					sx={{
						fontFamily: '"Space Mono", monospace',
						fontSize: '0.75rem',
						color: 'primary.main',
						letterSpacing: '0.06em',
						mb: 0.5,
					}}
				>
					{eyebrow}
				</Typography>
			)}
			<Typography
				variant='h3'
				sx={{
					fontSize: isList
						? { xs: '0.9375rem', sm: '1.125rem' }
						: { xs: '1.0625rem', sm: '1.25rem' },
					lineHeight: 1.2,
					textTransform: 'uppercase',
					overflowWrap: 'anywhere',
					color: emphasized ? 'error.main' : 'inherit',
				}}
			>
				{title}
			</Typography>
			{description != null && (
				<Box sx={{ mt: isList ? 0.75 : 1 }}>
					{typeof description === 'string' ? (
						<MonoText sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
							{description}
						</MonoText>
					) : (
						description
					)}
				</Box>
			)}
		</Box>
	);

	const priceRow = (price != null || priceToggle != null) && (
		<Box
			sx={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: isList ? 'flex-end' : 'space-between',
				gap: 1,
				flexWrap: 'wrap',
				minWidth: 0,
			}}
		>
			{price != null && (
				<Typography
					sx={{
						fontFamily: '"Space Mono", monospace',
						fontSize: isList
							? { xs: '0.9375rem', sm: '1rem' }
							: { xs: '1rem', sm: '1.125rem' },
						fontWeight: 700,
						color: emphasized ? 'error.main' : 'inherit',
						minWidth: 0,
					}}
				>
					{price}
				</Typography>
			)}
			{priceToggle}
		</Box>
	);

	return (
		<HardShadow
			sx={{
				bgcolor: 'background.paper',
				display: 'flex',
				flexDirection: isList ? { xs: 'column', sm: 'row' } : 'column',
				alignItems: isList ? 'stretch' : undefined,
				height: isList ? 'auto' : '100%',
				minWidth: 0,
				position: 'relative',
				...(soldOut
					? {
							filter: 'grayscale(1)',
							overflow: 'hidden',
							borderColor: 'text.secondary',
							boxShadow: (theme) => `6px 6px 0 0 ${theme.palette.text.secondary}`,
						}
					: {}),
				...(emphasized
					? {
							borderColor: 'error.main',
							boxShadow: (theme) => `6px 6px 0 0 ${theme.palette.error.main}`,
						}
					: {}),
			}}
		>
			{!isList && showHeader && (
				<Box
					sx={{
						borderBottom: '2px solid',
						borderColor: accentBorder,
						p: 1,
						px: 2,
						display: 'flex',
						justifyContent: 'space-between',
						bgcolor: 'surface.muted',
					}}
				>
					<Typography
						sx={{
							fontFamily: '"Space Mono", monospace',
							fontSize: '0.875rem',
							color: 'primary.main',
						}}
					>
						{eyebrow}
					</Typography>
				</Box>
			)}

			<Box
				sx={
					isList
						? {
								p: { xs: 1.5, sm: 2 },
								flexGrow: 1,
								display: 'flex',
								flexDirection: 'row',
								alignItems: 'center',
								gap: { xs: 1.5, sm: 2 },
								minWidth: 0,
							}
						: {
								p: { xs: 2, sm: 3 },
								flexGrow: 1,
								display: 'flex',
								flexDirection: 'column',
								gap: 2,
								minWidth: 0,
							}
				}
			>
				<Box
					sx={{
						...(isList
							? {
									width: { xs: 72, sm: 96 },
									height: { xs: 72, sm: 96 },
									flexShrink: 0,
								}
							: { aspectRatio: '1/1' }),
						bgcolor: 'surface.chip',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						border: '1px solid',
						borderColor: 'divider',
						position: 'relative',
						overflow: 'hidden',
					}}
				>
					{promoBadge}
					{image}
					{soldOutOverlay}
				</Box>

				{titleBlock}
			</Box>

			{hasFooter && (
				<Box
					sx={{
						p: isList ? { xs: 1.5, sm: 2 } : 2,
						px: { xs: 2, sm: isList ? 2 : 3 },
						...(isList
							? {
									borderTop: { xs: '2px solid', sm: 'none' },
									borderLeft: { xs: 'none', sm: '2px solid' },
									width: { sm: 200 },
									flexShrink: 0,
									justifyContent: 'center',
								}
							: {
									borderTop: '2px solid',
									mt: 'auto',
								}),
						borderColor: accentBorder,
						display: 'flex',
						flexDirection: 'column',
						gap: isList ? 1.25 : 2,
						minWidth: 0,
					}}
				>
					{priceRow}
					{action}
				</Box>
			)}
			{soldOut && (
				<Box
					aria-hidden
					sx={{
						position: 'absolute',
						inset: 0,
						zIndex: 2,
						pointerEvents: 'none',
						background: (theme) => {
							const line = theme.palette.text.secondary;
							return `linear-gradient(to top right, transparent calc(50% - 1.5px), ${line} calc(50% - 1.5px), ${line} calc(50% + 1.5px), transparent calc(50% + 1.5px))`;
						},
					}}
				/>
			)}
		</HardShadow>
	);
};
