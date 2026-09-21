import { AdminCoursesView } from '@views/Admin/AdminCoursesView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Admin — szkolenia',
	robots: { index: false, follow: false },
};

export default function AdminCoursesPage() {
	return <AdminCoursesView />;
}
