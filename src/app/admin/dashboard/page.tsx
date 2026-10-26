import { AdminDashboardView } from '@views/Admin/AdminDashboardView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Admin — dashboard',
	robots: { index: false, follow: false },
};

export default function AdminDashboardPage() {
	return <AdminDashboardView />;
}
