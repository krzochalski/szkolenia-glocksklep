import dayjs, { type ConfigType, type Dayjs } from 'dayjs';

/** Payment due date = class date minus this many days (proforma + regulamin VI). */
export const PROFORMA_DUE_DAYS_BEFORE = 5;

/** YYYY-MM-DD due date for a class date. */
export const proformaDueDate = (classDate: ConfigType): string =>
	dayjs(classDate).subtract(PROFORMA_DUE_DAYS_BEFORE, 'day').format('YYYY-MM-DD');

/**
 * Unpaid and past the proforma due date (day after due counts as overdue).
 * Paid participants are never overdue.
 */
export const isParticipantPaymentOverdue = (
	paid: boolean | undefined,
	classDate: ConfigType,
	today: Dayjs = dayjs()
): boolean => {
	if (paid) return false;
	return today.startOf('day').isAfter(dayjs(proformaDueDate(classDate)), 'day');
};
