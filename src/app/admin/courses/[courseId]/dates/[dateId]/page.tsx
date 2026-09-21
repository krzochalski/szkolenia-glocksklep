import { AdminCourseDateDetailView } from '@views/Admin/AdminCourseDateDetailView';
import type { Metadata } from 'next';

type Props = {
	params: Promise<{ courseId: string; dateId: string }>;
};

export const metadata: Metadata = {
	title: 'Admin — szczegóły terminu',
	robots: { index: false, follow: false },
};

export default async function AdminCourseDateDetailPage({ params }: Props) {
	const { courseId, dateId } = await params;
	return <AdminCourseDateDetailView courseId={courseId} dateId={dateId} />;
}
