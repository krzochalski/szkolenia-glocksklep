import type { ReactNode } from 'react';

export type CourseModule = {
	icon: ReactNode;
	title: string;
	desc: string;
};

export type CourseSchemaData = {
	/** Eyebrow label above the headline, e.g. "Core Methodology" */
	eyebrow: string;
	/** Main headline, split into two lines: line1 plain, line2 accented */
	headline: [string, string];
	/** Lead paragraph below the headline */
	description: string;
	/** Course slug — drives the dates section */
	slug?: string;
	/** Program modules grid */
	modules?: CourseModule[];
	/** Who should attend */
	forWhom?: string[];
	/** Custom heading for forWhom section */
	forWhomHeading?: string;
	/** What will NOT be there */
	notExpect?: string[];
	/** Custom heading for notExpect section */
	notExpectHeading?: string;
	/** What to bring */
	bring?: string[];
	/** Custom heading for bring section */
	bringHeading?: string;
	/** What NOT to bring */
	dontBring?: string[];
	/** Custom heading for dontBring section */
	dontBringHeading?: string;
};
