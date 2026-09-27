import { AdminHomepageView } from '@views/Admin/AdminHomepageView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Admin — strona główna',
	robots: { index: false, follow: false },
};

export default function AdminHomepagePage() {
	return <AdminHomepageView />;
}
