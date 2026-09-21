import { AdminSciezkaRozwojuView } from '@views/Admin/AdminSciezkaRozwojuView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Admin — ścieżka rozwoju',
	robots: { index: false, follow: false },
};

export default function AdminSciezkaRozwojuPage() {
	return <AdminSciezkaRozwojuView />;
}
