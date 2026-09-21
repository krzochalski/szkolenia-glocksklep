import { AdminRegulaminView } from '@views/Admin/AdminRegulaminView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Admin — regulamin',
	robots: { index: false, follow: false },
};

export default function AdminRegulaminPage() {
	return <AdminRegulaminView />;
}
