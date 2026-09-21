import { AdminCourseDescriptionEditView } from '@views/Admin/AdminCourseDescriptionEditView';
import type { Metadata } from 'next';

type Props = {
	params: Promise<{ slug: string }>;
};

export const metadata: Metadata = {
	title: 'Admin — edycja opisu',
	robots: { index: false, follow: false },
};

export default async function AdminCourseDescriptionEditPage({ params }: Props) {
	const { slug } = await params;
	return <AdminCourseDescriptionEditView slug={slug} />;
}
