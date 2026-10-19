import { AdminDebriefingEditView } from '@views/Admin/AdminDebriefingEditView';
import type { Metadata } from 'next';

type Props = {
	params: Promise<{ courseId: string }>;
};

export const metadata: Metadata = {
	title: 'Admin — edycja debriefingu',
	robots: { index: false, follow: false },
};

export default async function AdminDebriefingEditPage({ params }: Props) {
	const { courseId } = await params;
	return <AdminDebriefingEditView courseId={courseId} />;
}
