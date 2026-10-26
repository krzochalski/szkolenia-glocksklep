import type { SessionStatus } from '@/utils/adminDashboard';

export const SESSION_STATUS_LABEL: Record<SessionStatus, string> = {
	open: 'Otwarte',
	full: 'Pełne',
	cancelled: 'Anulowane',
	at_risk: 'Poniżej minimum',
	needs_decision: 'Do decyzji',
};

export const sessionStatusChipColor = (
	status: SessionStatus
): 'default' | 'success' | 'warning' | 'error' => {
	if (status === 'full') return 'warning';
	if (status === 'cancelled') return 'error';
	if (status === 'at_risk') return 'warning';
	if (status === 'needs_decision') return 'error';
	return 'success';
};
