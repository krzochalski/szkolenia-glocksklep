import { createTheme } from '@mui/material/styles';

/** Shared brand tokens — use in theme and non-MUI styles (e.g. CookieConsent). */
export const brand = {
	primary: '#FF4F00',
	primaryHover: '#e64600',
	primarySoft: 'rgba(255, 79, 0, 0.04)',
	ink: '#191c1d',
	inkAlt: '#1a1a1a',
	inkSoft: 'rgba(25, 28, 29, 0.04)',
	inkOverlay: 'rgba(25, 28, 29, 0.5)',
	paper: '#ffffff',
	textSecondary: '#494847',
	surfaceMuted: '#f3f4f5',
	surfaceSoft: '#e7e8e9',
	surfaceSofter: '#edeeef',
	surfaceChip: '#e2e2e5',
	surfaceHero: 'rgba(248, 249, 250, 0.95)',
	borderMuted: '#d9dadb',
	accentDark: '#a93100',
	accentSoft: '#ffb59e',
	accentPale: '#ffdad6',
	accentWarm: '#5c4037',
	accentMuted: '#916f65',
	accentMutedSoft: 'rgba(145, 111, 101, 0.3)',
	brownGray: '#5c5f60',
	dangerTint: 'rgba(159, 5, 25, 0.15)',
	primaryTint: 'rgba(255, 144, 108, 0.1)',
} as const;

declare module '@mui/material/styles' {
	interface TypeBackground {
		subtle: string;
		card: string;
		input: string;
		elevated: string;
		neutral: string;
	}

	interface Palette {
		ink: Palette['primary'];
		surface: {
			muted: string;
			soft: string;
			softer: string;
			chip: string;
		};
		borderMuted: Palette['primary'];
		accentDark: Palette['primary'] & {
			soft: string;
			pale: string;
			warm: string;
			muted: string;
		};
		border: {
			subtle: string;
			default: string;
		};
		accent: {
			glow: string;
		};
	}

	interface PaletteOptions {
		ink?: PaletteOptions['primary'];
		surface?: {
			muted?: string;
			soft?: string;
			softer?: string;
			chip?: string;
		};
		borderMuted?: PaletteOptions['primary'];
		accentDark?: PaletteOptions['primary'] & {
			soft?: string;
			pale?: string;
			warm?: string;
			muted?: string;
		};
		border?: {
			subtle?: string;
			default?: string;
		};
		accent?: {
			glow?: string;
		};
	}
}

/**
 * Tactical Precision 8-Bit Theme
 * A custom MUI theme for Glockacci Tuning, blending industrial precision
 * with a technical 8-bit aesthetic.
 */
const theme = createTheme({
	palette: {
		mode: 'light',
		primary: {
			main: brand.primary,
			dark: brand.primaryHover,
			contrastText: brand.paper,
		},
		secondary: {
			main: brand.ink,
			contrastText: brand.paper,
		},
		background: {
			default: brand.paper,
			paper: brand.paper,
			subtle: brand.surfaceMuted,
			card: brand.paper,
			input: brand.surfaceSofter,
			elevated: brand.paper,
			neutral: brand.surfaceSoft,
		},
		text: {
			primary: brand.ink,
			secondary: brand.textSecondary,
		},
		divider: 'rgba(0, 0, 0, 0.12)',
		ink: {
			main: brand.ink,
			light: brand.inkAlt,
			contrastText: brand.paper,
		},
		surface: {
			muted: brand.surfaceMuted,
			soft: brand.surfaceSoft,
			softer: brand.surfaceSofter,
			chip: brand.surfaceChip,
		},
		borderMuted: {
			main: brand.borderMuted,
			contrastText: brand.ink,
		},
		accentDark: {
			main: brand.accentDark,
			soft: brand.accentSoft,
			pale: brand.accentPale,
			warm: brand.accentWarm,
			muted: brand.accentMuted,
			contrastText: brand.paper,
		},
		border: {
			subtle: brand.borderMuted,
			default: brand.borderMuted,
		},
		accent: {
			glow: brand.primaryTint,
		},
	},
	typography: {
		fontFamily: '"Space Grotesk", "Roboto", "Helvetica", "Arial", sans-serif',
		h1: {
			fontWeight: 800,
			textTransform: 'uppercase',
			letterSpacing: '-0.02em',
			fontSize: '2.5rem',
		},
		h2: {
			fontWeight: 800,
			textTransform: 'uppercase',
			letterSpacing: '-0.01em',
			fontSize: '2rem',
		},
		h3: {
			fontWeight: 700,
			textTransform: 'uppercase',
			letterSpacing: '0.02em',
			fontSize: '1.5rem',
		},
		button: {
			fontWeight: 700,
			textTransform: 'uppercase',
			letterSpacing: '0.1em',
			fontSize: '0.875rem',
		},
		overline: {
			fontWeight: 600,
			letterSpacing: '0.2em',
			color: brand.primary,
			textTransform: 'uppercase',
		},
		caption: {
			fontFamily: '"Space Mono", "Courier New", monospace',
			letterSpacing: '0.05em',
			textTransform: 'uppercase',
		},
	},
	shape: {
		borderRadius: 0,
	},
	components: {
		MuiCssBaseline: {
			styleOverrides: {
				body: {
					backgroundImage:
						'linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px)',
					backgroundSize: '20px 20px',
					backgroundColor: brand.paper,
				},
			},
		},
		MuiButton: {
			defaultProps: {
				disableElevation: true,
			},
			styleOverrides: {
				root: {
					borderRadius: 0,
					padding: '12px 28px',
					minHeight: 48,
					borderWidth: '2px',
					display: 'inline-flex',
					alignItems: 'center',
					justifyContent: 'center',
					lineHeight: 1.2,
					'&:hover': {
						borderWidth: '2px',
					},
				},
			},
			variants: [
				{
					props: { variant: 'contained', color: 'primary' },
					style: {
						backgroundColor: brand.primary,
						'&:hover': {
							backgroundColor: brand.primaryHover,
						},
					},
				},
				{
					props: { variant: 'outlined', color: 'primary' },
					style: {
						borderColor: brand.primary,
						borderWidth: '2px',
						'&:hover': {
							borderColor: brand.primaryHover,
							borderWidth: '2px',
							backgroundColor: brand.primarySoft,
						},
					},
				},
			],
		},
		MuiCard: {
			styleOverrides: {
				root: {
					borderRadius: 0,
					border: '1px solid rgba(0, 0, 0, 0.1)',
					boxShadow: 'none',
					backgroundColor: brand.paper,
					'&:hover': {
						borderColor: brand.primary,
						boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
					},
				},
			},
		},
		MuiPaper: {
			styleOverrides: {
				root: {
					borderRadius: 0,
					boxShadow: 'none',
					border: '1px solid rgba(0, 0, 0, 0.1)',
				},
			},
		},
		MuiAppBar: {
			styleOverrides: {
				root: {
					backgroundColor: brand.paper,
					color: brand.ink,
					borderBottom: `2px solid ${brand.ink}`,
					boxShadow: 'none',
				},
			},
		},
		MuiIconButton: {
			styleOverrides: {
				root: {
					borderRadius: 0,
					minWidth: 48,
					minHeight: 48,
				},
				sizeSmall: {
					minWidth: 48,
					minHeight: 48,
				},
			},
		},
		MuiFab: {
			styleOverrides: {
				root: {
					borderRadius: 0,
				},
			},
		},
		MuiTypography: {
			defaultProps: {
				variantMapping: {
					h1: 'h1',
					h2: 'h2',
					h3: 'h3',
					body1: 'p',
					body2: 'span',
				},
			},
		},
	},
});

export default theme;
