import { AdminDebriefingsView } from '@views/Admin/AdminDebriefingsView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Admin — debriefing',
	robots: { index: false, follow: false },
};

export default function AdminDebriefingsPage() {
	return <AdminDebriefingsView />;
}
