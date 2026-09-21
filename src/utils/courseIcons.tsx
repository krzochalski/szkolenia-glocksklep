import {
	Analytics,
	BarChart,
	Block,
	Build,
	CheckCircle,
	Dashboard,
	FitnessCenter,
	FlashlightOn,
	GppGood,
	GpsFixed,
	Inventory2,
	LocalFireDepartment,
	Lock,
	Security,
	Settings,
	SportsScore,
	Timeline,
	TrendingUp,
	Visibility,
	Warning,
	Whatshot,
} from '@ui/icons';
import type { ReactNode } from 'react';

type CourseIconComponent = typeof GpsFixed;

/** Icons available for course description modules (admin-stored name → component). */
export const COURSE_ICON_COMPONENTS: Record<string, CourseIconComponent> = {
	Analytics,
	BarChart,
	Block,
	Build,
	CheckCircle,
	Dashboard,
	FitnessCenter,
	FlashlightOn,
	GppGood,
	GpsFixed,
	Inventory2,
	LocalFireDepartment,
	Lock,
	Security,
	Settings,
	SportsScore,
	Timeline,
	TrendingUp,
	Visibility,
	Warning,
	Whatshot,
};

export const getCourseIcon = (name: string): ReactNode => {
	const Icon = COURSE_ICON_COMPONENTS[name] ?? GpsFixed;
	return <Icon sx={{ fontSize: 20 }} />;
};
