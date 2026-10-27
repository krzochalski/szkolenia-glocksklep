'use client';

import { getFaqItems } from '@services/faq';
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Box,
	Button,
	Chip,
	CircularProgress,
	ContentSwap,
	Stack,
	Typography,
} from '@ui';
import { ExpandMoreIcon } from '@ui/icons';
import { useQuery } from '@tanstack/react-query';
import NextLink from 'next/link';
import { useMemo, useState } from 'react';
import { FAQ_CATEGORY_OPTIONS } from '@constants/faqCategories';
import type { FaqItem, FaqLink } from '@/types/faq';

type Props = {
	readonly initialItems?: FaqItem[];
};

const ALL_CATEGORY = 'all';

const resolveLinks = (item: FaqItem): FaqLink[] => {
	if (item.links && item.links.length > 0) return item.links;
	return item.link ? [item.link] : [];
};

const isInternalHref = (href: string): boolean => href.startsWith('/');

export const FaqView = ({ initialItems }: Props) => {
	const { data: items = [], isLoading } = useQuery({
		queryKey: ['faq'],
		queryFn: getFaqItems,
		...(initialItems !== undefined ? { initialData: initialItems } : {}),
	});
	const [category, setCategory] = useState<string>(ALL_CATEGORY);
	const [expandedId, setExpandedId] = useState<string | false>(false);

	const presentCategories = useMemo(() => {
		const used = new Set(items.map((item) => item.category ?? 'rekrutacja'));
		return FAQ_CATEGORY_OPTIONS.filter((opt) => used.has(opt.value));
	}, [items]);

	const filteredItems = useMemo(() => {
		if (category === ALL_CATEGORY) return items;
		return items.filter((item) => (item.category ?? 'rekrutacja') === category);
	}, [items, category]);

	const listState = isLoading ? 'loading' : items.length === 0 ? 'empty' : 'content';

	return (
		<Box sx={{ width: '100%' }}>
			<Typography
				variant='h4'
				component='h1'
				gutterBottom
				sx={{ fontWeight: 700, fontSize: { xs: '1.75rem', md: '2.25rem' } }}
			>
				Najczęściej zadawane pytania
			</Typography>
			<Typography color='text.secondary' sx={{ mb: 3 }}>
				Zapisy, płatności, sprzęt i ścieżka — bez lania wody.
			</Typography>

			<ContentSwap state={listState}>
				{isLoading ? (
					<Box sx={{ display: 'flex', justifyContent: 'center' }}>
						<CircularProgress />
					</Box>
				) : items.length === 0 ? (
					<Typography color='text.secondary'>Brak pytań na liście.</Typography>
				) : (
					<Box>
						{presentCategories.length > 1 ? (
							<Stack
								direction='row'
								useFlexGap
								spacing={1}
								sx={{ mb: 3, flexWrap: 'wrap' }}
								role='group'
								aria-label='Filtr kategorii FAQ'
							>
								<Chip
									label='Wszystkie'
									clickable
									color={category === ALL_CATEGORY ? 'primary' : 'default'}
									variant={category === ALL_CATEGORY ? 'filled' : 'outlined'}
									onClick={() => setCategory(ALL_CATEGORY)}
									sx={{
										fontWeight: category === ALL_CATEGORY ? 700 : 500,
										borderWidth: 2,
									}}
								/>
								{presentCategories.map((opt) => (
									<Chip
										key={opt.value}
										label={opt.label}
										clickable
										color={category === opt.value ? 'primary' : 'default'}
										variant={category === opt.value ? 'filled' : 'outlined'}
										onClick={() => setCategory(opt.value)}
										sx={{
											fontWeight: category === opt.value ? 700 : 500,
											borderWidth: 2,
										}}
									/>
								))}
							</Stack>
						) : null}

						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
							{filteredItems.map((item) => {
								const links = resolveLinks(item);
								const expanded = expandedId === item.id;
								return (
									<Accordion
										key={item.id}
										disableGutters
										elevation={0}
										expanded={expanded}
										onChange={(_, isExpanded) =>
											setExpandedId(isExpanded ? item.id : false)
										}
										sx={{
											border: '2px solid',
											borderColor: expanded ? 'ink.main' : 'divider',
											borderRadius: '0 !important',
											bgcolor: 'background.paper',
											'&:before': { display: 'none' },
											transition: 'border-color 0.15s ease',
										}}
									>
										<AccordionSummary
											expandIcon={<ExpandMoreIcon sx={{ color: 'primary.main' }} />}
											aria-controls={`faq-panel-${item.id}`}
											id={`faq-header-${item.id}`}
											sx={{
												px: 2.5,
												py: 0.5,
												'& .MuiAccordionSummary-content': { my: 2 },
												'&.Mui-focusVisible': {
													outline: '2px solid',
													outlineColor: 'primary.main',
													outlineOffset: -2,
												},
											}}
										>
											<Typography
												component='h2'
												sx={{
													fontWeight: 700,
													fontSize: { xs: '1.05rem', md: '1.15rem' },
													lineHeight: 1.35,
													pr: 1,
												}}
											>
												{item.question}
											</Typography>
										</AccordionSummary>
										<AccordionDetails sx={{ px: 2.5, pb: 2.5, pt: 0 }}>
											<Typography
												variant='body1'
												sx={{
													color: 'text.secondary',
													lineHeight: 1.75,
													whiteSpace: 'pre-wrap',
													fontSize: '0.95rem',
												}}
											>
												{item.answer}
											</Typography>
											{links.length > 0 ? (
												<Stack
													direction={{ xs: 'column', sm: 'row' }}
													spacing={1.5}
													useFlexGap
													sx={{ mt: 2.5, flexWrap: 'wrap' }}
												>
													{links.map((link) =>
														isInternalHref(link.href) ? (
															<Button
																key={`${link.href}-${link.label}`}
																component={NextLink}
																href={link.href}
																variant='contained'
																size='small'
															>
																{link.label}
															</Button>
														) : (
															<Button
																key={`${link.href}-${link.label}`}
																component='a'
																href={link.href}
																variant='outlined'
																size='small'
																{...(link.href.startsWith('mailto:')
																	? {}
																	: {
																			target: '_blank',
																			rel: 'noopener noreferrer',
																		})}
															>
																{link.label}
															</Button>
														)
													)}
												</Stack>
											) : null}
										</AccordionDetails>
									</Accordion>
								);
							})}
						</Box>
					</Box>
				)}
			</ContentSwap>
		</Box>
	);
};
