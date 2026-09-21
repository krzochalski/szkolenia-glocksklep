import { AdminCourseDatesView } from '@views/Admin/AdminCourseDatesView';
import type { Metadata } from 'next';

type Props = {
	params: Promise<{ courseId: string }>;
};

export const metadata: Metadata = {
	title: 'Admin — terminy',
	robots: { index: false, follow: false },
};

export default async function AdminCourseDatesPage({ params }: Props) {
	const { courseId } = await params;
	return <AdminCourseDatesView courseId={courseId} />;
}
