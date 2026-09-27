import { AdminContactRequestsView } from '@views/Admin/AdminContactRequestsView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Admin — zgłoszenia kontaktu',
	robots: { index: false, follow: false },
};

export default function AdminContactRequestsPage() {
	return <AdminContactRequestsView />;
}
