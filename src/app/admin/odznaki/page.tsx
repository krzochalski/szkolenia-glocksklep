import { AdminBadgesView } from '@views/Admin/AdminBadgesView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Admin — odznaki',
	robots: { index: false, follow: false },
};

export default function AdminOdznakiPage() {
	return <AdminBadgesView />;
}
