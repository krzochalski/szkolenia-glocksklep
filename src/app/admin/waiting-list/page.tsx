import { AdminWaitingListView } from '@views/Admin/AdminWaitingListView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Admin — lista oczekujących',
	robots: { index: false, follow: false },
};

export default function AdminWaitingListPage() {
	return <AdminWaitingListView />;
}
