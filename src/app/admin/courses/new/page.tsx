import { AdminCourseNewView } from '@views/Admin/AdminCourseNewView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Admin — nowe szkolenie',
	robots: { index: false, follow: false },
};

export default function AdminCourseNewPage() {
	return <AdminCourseNewView />;
}
