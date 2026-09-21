import { AdminCourseEditView } from '@views/Admin/AdminCourseEditView';
import type { Metadata } from 'next';

type Props = {
	params: Promise<{ courseId: string }>;
};

export const metadata: Metadata = {
	title: 'Admin — edycja szkolenia',
	robots: { index: false, follow: false },
};

export default async function AdminCourseEditPage({ params }: Props) {
	const { courseId } = await params;
	return <AdminCourseEditView courseId={courseId} />;
}
