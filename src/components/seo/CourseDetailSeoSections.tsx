'use client';

import { Paths } from '@constants/paths';
import { buildCourseFaqItems } from '@seo/courseFaq';
import { pickRelatedCourses } from '@seo/relatedCourses';
import type { Course } from '@/types/course';
import type { FaqItem } from '@/types/faq';
import { fillPath } from '@/utils/paths';
import { Box, Button, Divider, FaqSection, HardShadow, Link, Typography } from '@ui';
import NextLink from 'next/link';

type CourseDetailSeoSectionsProps = {
	readonly course: Course;
	readonly catalog: readonly Course[];
	readonly faqItems: readonly FaqItem[];
};

export const CourseDetailSeoSections = ({
	course,
	catalog,
	faqItems,
}: CourseDetailSeoSectionsProps) => {
	const faq = buildCourseFaqItems(course, faqItems);
	const related = pickRelatedCourses(course, catalog);

	return (
		<>
			{related.length > 0 ? (
				<Box component='section' aria-labelledby='related-courses-heading' sx={{ mb: 6 }}>
					<Divider sx={{ mb: 4 }} />
					<Typography
						id='related-courses-heading'
						variant='h2'
						sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, mb: 3 }}
					>
						Powiązane szkolenia
					</Typography>
					<Box
						sx={{
							display: 'grid',
							gap: 2,
							gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
						}}
					>
						{related.map((item) => (
							<HardShadow
								key={item.id}
								sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}
							>
								<Typography sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
									{item.name}
								</Typography>
								<Typography variant='body2' color='text.secondary' sx={{ flex: 1 }}>
									{item.description.length > 120
										? `${item.description.slice(0, 117)}…`
										: item.description}
								</Typography>
								<Button
									component={NextLink}
									href={fillPath(Paths.coursePage, { slug: item.slug })}
									variant='outlined'
									size='small'
									sx={{ alignSelf: 'flex-start' }}
								>
									Szczegóły
								</Button>
							</HardShadow>
						))}
					</Box>
					<Typography sx={{ mt: 3 }}>
						<Link component={NextLink} href={Paths.sciezkaRozwoju} underline='hover'>
							Zobacz całą ścieżkę rozwoju
						</Link>
						{' · '}
						<Link component={NextLink} href={Paths.faq} underline='hover'>
							FAQ o zapisach i sprzęcie
						</Link>
					</Typography>
				</Box>
			) : null}

			{faq.length > 0 ? (
				<Box component='section' sx={{ mb: 6 }}>
					<Divider sx={{ mb: 4 }} />
					<FaqSection
						items={faq}
						title='Najczęstsze pytania o to szkolenie'
						headingVariant='h3'
					/>
				</Box>
			) : null}
		</>
	);
};