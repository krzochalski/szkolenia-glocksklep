import { Box } from '../primitives';
import type { ReactNode } from 'react';

/** Bottom padding so page content clears the fixed mobile sticky bar. */
export const mobileStickyContentPb = { xs: 14, md: 4 } as const;

type MobileStickyActionBarProps = {
	readonly summary?: ReactNode;
	readonly action: ReactNode;
};

export const MobileStickyActionBar = ({ summary, action }: MobileStickyActionBarProps) => (
	<Box
		sx={{
			display: { xs: 'flex', md: 'none' },
			position: 'fixed',
			left: 0,
			right: 0,
			bottom: 0,
			zIndex: 20,
			flexDirection: 'column',
			gap: 1,
			bgcolor: 'background.paper',
			borderTop: '3px solid',
			borderColor: 'ink.main',
			px: 2,
			pt: 1.5,
			pb: 'max(12px, env(safe-area-inset-bottom))',
		}}
	>
		{summary != null && (
			<Box
				sx={{
					width: '100%',
					fontFamily: '"Space Mono", monospace',
					fontSize: '0.75rem',
					fontWeight: 700,
					letterSpacing: '0.06em',
					textTransform: 'uppercase',
				}}
			>
				{summary}
			</Box>
		)}
		<Box sx={{ width: '100%', '& > *': { width: '100%' } }}>{action}</Box>
	</Box>
);
