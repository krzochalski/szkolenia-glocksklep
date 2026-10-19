import { AdminCookiesPolicyView } from '@views/Admin/AdminCookiesPolicyView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Admin — polityka cookies',
	robots: { index: false, follow: false },
};

export default function AdminCookiesPolicyPage() {
	return <AdminCookiesPolicyView />;
}
