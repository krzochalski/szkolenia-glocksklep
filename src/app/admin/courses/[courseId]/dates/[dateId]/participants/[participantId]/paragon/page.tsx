import { AdminParticipantParagonPrintView } from '@views/Admin/AdminParticipantParagonPrintView';
import type { Metadata } from 'next';

type Props = {
	params: Promise<{ courseId: string; dateId: string; participantId: string }>;
};

export const metadata: Metadata = {
	title: 'Admin — druk paragonu',
	robots: { index: false, follow: false },
};

export default async function AdminParticipantParagonPage({ params }: Props) {
	const { courseId, dateId, participantId } = await params;
	return (
		<AdminParticipantParagonPrintView
			courseId={courseId}
			dateId={dateId}
			participantId={participantId}
		/>
	);
}