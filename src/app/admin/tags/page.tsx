import { AdminTagsView } from '@views/Admin/AdminTagsView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Admin — tagi',
	robots: { index: false, follow: false },
};

export default function AdminTagsPage() {
	return <AdminTagsView />;
}
