import { AdminPlacesView } from '@views/Admin/AdminPlacesView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Admin — obiekty',
	robots: { index: false, follow: false },
};

export default function AdminPlacesPage() {
	return <AdminPlacesView />;
}
