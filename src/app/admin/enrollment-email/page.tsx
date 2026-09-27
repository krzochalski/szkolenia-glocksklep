import { AdminEnrollmentEmailView } from '@views/Admin/AdminEnrollmentEmailView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Admin — e-mail po zapisie',
	robots: { index: false, follow: false },
};

export default function AdminEnrollmentEmailPage() {
	return <AdminEnrollmentEmailView />;
}
