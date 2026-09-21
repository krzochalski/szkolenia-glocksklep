export interface FaqItem {
	id: string;
	/** Question text */
	question: string;
	/** Answer text */
	answer: string;
	/** Optional link */
	link?: { href: string; label: string };
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
