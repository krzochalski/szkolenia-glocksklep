import { AdminCourseDescriptionsView } from '@views/Admin/AdminCourseDescriptionsView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Admin — opisy szkoleń',
	robots: { index: false, follow: false },
};

export default function AdminCourseDescriptionsPage() {
	return <AdminCourseDescriptionsView />;
}
