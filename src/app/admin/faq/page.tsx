import { AdminFaqView } from '@views/Admin/AdminFaqView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Admin — FAQ',
	robots: { index: false, follow: false },
};

export default function AdminFaqPage() {
	return <AdminFaqView />;
}
