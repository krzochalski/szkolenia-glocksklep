import { AdminNearestDatesView } from '@views/Admin/AdminNearestDatesView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Admin — najbliższe terminy',
	robots: { index: false, follow: false },
};

export default function AdminNearestDatesPage() {
	return <AdminNearestDatesView />;
}
