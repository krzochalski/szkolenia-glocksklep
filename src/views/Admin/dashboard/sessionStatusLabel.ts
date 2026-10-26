import type { SessionStatus } from '@/utils/adminDashboard';

export const SESSION_STATUS_LABEL: Record<SessionStatus, string> = {
	open: 'Otwarte',
	full: 'Pełne',
	cancelled: 'Anulowane',
};

export const sessionStatusChipColor = (
	status: SessionStatus
): 'default' | 'success' | 'warning' | 'error' => {
	if (status === 'full') return 'warning';
	if (status === 'cancelled') return 'error';
	return 'success';
};
