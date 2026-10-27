export interface FaqLink {
	href: string;
	label: string;
}

export interface FaqItem {
	id: string;
	/** Question text */
	question: string;
	/** Answer text */
	answer: string;
	/** Optional primary CTA (admin form; also used if `links` is empty) */
	link?: FaqLink;
	/** Optional CTAs under the answer */
	links?: FaqLink[];
	/** Display order (lower = first) */
	order: number;
	/** Category for grouping FAQ items */
	category?: string;
}

export interface FaqCategory {
	id: string;
	label: string;
	anchor: string;
}
