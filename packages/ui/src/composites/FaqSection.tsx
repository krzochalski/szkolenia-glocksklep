import { ExpandMoreIcon } from '../icons';
import { Accordion, AccordionDetails, AccordionSummary, Box, Typography } from '../primitives';

export type FaqItem = {
	readonly content: string;
	readonly title: string;
};

type FaqSectionProps = {
	readonly items: readonly FaqItem[];
	readonly title?: string;
	/** Use h1 on standalone FAQ page; keep h3 under a product h1. */
	readonly headingVariant?: 'h1' | 'h3';
};

export const FaqSection = ({ items, title = 'FAQ', headingVariant = 'h3' }: FaqSectionProps) => (
	<Box>
		<Typography
			variant={headingVariant}
			sx={{
				mb: 6,
				fontSize: { xs: '1.75rem', md: '2.25rem' },
				textTransform: 'uppercase',
				fontFamily: '"Space Mono", monospace',
			}}
		>
			{title}
		</Typography>
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
			{items.map(({ content, title: question }) => (
				<Accordion
					key={question}
					disableGutters
					elevation={0}
					sx={{
						border: '2px solid',
						borderColor: 'divider',
						borderRadius: '0 !important',
						'&:before': { display: 'none' },
					}}
				>
					<AccordionSummary
						expandIcon={<ExpandMoreIcon sx={{ color: 'primary.main' }} />}
						sx={{
							px: 3,
							py: 1,
							'& .MuiAccordionSummary-content': { my: 2 },
						}}
					>
						<Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>{question}</Typography>
					</AccordionSummary>
					<AccordionDetails sx={{ px: 3, pb: 3 }}>
						<Typography
							variant='body1'
							sx={{
								color: 'text.secondary',
								lineHeight: 1.8,
								whiteSpace: 'pre-line',
							}}
						>
							{content}
						</Typography>
					</AccordionDetails>
				</Accordion>
			))}
		</Box>
	</Box>
);
