import { AdminParticipantsView } from '@views/Admin/AdminParticipantsView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Admin — użytkownicy',
	robots: { index: false, follow: false },
};

export default function AdminParticipantsPage() {
	return <AdminParticipantsView />;
}
