import dayjs from 'dayjs';
import 'dayjs/locale/pl';

import { formatPlnDisplay } from '@/utils/pricing';

dayjs.locale('pl');

/** Polish long date matching course page rows, e.g. `18 października 2026`. */
export const formatCourseDatePl = (date: string): string =>
	dayjs(date).locale('pl').format('D MMMM YYYY');

export type BookingSummaryInput = {
	readonly name: string;
	readonly date: string;
	readonly timeStart: string;
	readonly place?: string | null;
	readonly price: number;
};

/** One-line booking summary for confirm dialogs and auth banners. */
export const formatBookingSummary = ({
	name,
	date,
	timeStart,
	place,
	price,
}: BookingSummaryInput): string => {
	const parts = [
		name,
		formatCourseDatePl(date),
		timeStart,
		place?.trim() || '—',
		formatPlnDisplay(price),
	];
	return parts.join(', ');
};
