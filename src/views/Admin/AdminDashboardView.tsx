'use client';

import { getCourses } from '@services/courses';
import {
	buildMonthlyRevenue,
	buildSignupsSpotlight,
	buildUpcomingDates,
	revenueYearsPresent,
	type UpcomingHorizonDays,
	warsawToday,
} from '@/utils/adminDashboard';
import { Box, CircularProgress, ContentSwap, Stack, Typography } from '@ui';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
	MonthlyRevenueSection,
	type RevenueRange,
} from './dashboard/MonthlyRevenueSection';
import { SignupsSpotlightSection } from './dashboard/SignupsSpotlightSection';
import { UpcomingDatesSection } from './dashboard/UpcomingDatesSection';

export const AdminDashboardView = () => <DashboardInner />;

const DashboardInner = () => {
	const { data: courses = [], isLoading } = useQuery({
		queryKey: ['courses'],
		queryFn: getCourses,
	});
	const [horizonDays, setHorizonDays] = useState<UpcomingHorizonDays>(30);
	const [revenueRange, setRevenueRange] = useState<RevenueRange>({ mode: 'rolling' });

	const today = warsawToday();
	const warsawYear = Number(today.slice(0, 4));

	const yearOptions = useMemo(() => {
		const years = new Set(revenueYearsPresent(courses));
		years.add(warsawYear);
		return [...years].sort((a, b) => b - a);
	}, [courses, warsawYear]);

	const spotlight = useMemo(() => buildSignupsSpotlight(courses, today), [courses, today]);
	const upcoming = useMemo(
		() => buildUpcomingDates(courses, { days: horizonDays, today }),
		[courses, horizonDays, today]
	);
	const revenue = useMemo(() => {
		if (revenueRange.mode === 'year') {
			return buildMonthlyRevenue(courses, { year: revenueRange.year });
		}
		return buildMonthlyRevenue(courses, { months: 12, today });
	}, [courses, revenueRange, today]);

	return (
		<ContentSwap state={isLoading ? 'loading' : 'content'}>
			{isLoading ? (
				<CircularProgress />
			) : (
				<Box>
					<Typography variant='h5' gutterBottom>
						Dashboard
					</Typography>
					<Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
						Podgląd zapisów, nadchodzących terminów i przychodu z opłaconych miejsc.
					</Typography>

					<Stack spacing={4}>
						<Box
							sx={{
								display: 'grid',
								gap: 4,
								gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
								alignItems: 'start',
							}}
						>
							<SignupsSpotlightSection items={spotlight} />
							<UpcomingDatesSection
								items={upcoming}
								days={horizonDays}
								onDaysChange={setHorizonDays}
							/>
						</Box>
						<MonthlyRevenueSection
							items={revenue}
							range={revenueRange}
							yearOptions={yearOptions}
							onRangeChange={setRevenueRange}
						/>
					</Stack>
				</Box>
			)}
		</ContentSwap>
	);
};
