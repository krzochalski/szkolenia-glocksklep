import { AdminCourseDateNewView } from '@views/Admin/AdminCourseDateNewView';
import type { Metadata } from 'next';
import { Suspense } from 'react';

type Props = {
	params: Promise<{ courseId: string }>;
};

export const metadata: Metadata = {
	title: 'Admin — nowy termin',
	robots: { index: false, follow: false },
};

export default async function AdminCourseDateNewPage({ params }: Props) {
	const { courseId } = await params;
	return (
		<Suspense fallback={null}>
			<AdminCourseDateNewView courseId={courseId} />
		</Suspense>
	);
}
