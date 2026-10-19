import { ProfilDebriefingDetailView } from '@views/Profil/ProfilDebriefingDetailView';
import type { Metadata } from 'next';

type Props = {
	params: Promise<{ courseId: string }>;
};

export const metadata: Metadata = {
	title: 'Debriefing',
	robots: { index: false, follow: false },
};

export default async function ProfilDebriefingDetailPage({ params }: Props) {
	const { courseId } = await params;
	return <ProfilDebriefingDetailView courseId={courseId} />;
}
