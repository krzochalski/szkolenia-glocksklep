import { AdminPrivacyPolicyView } from '@views/Admin/AdminPrivacyPolicyView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Admin — polityka prywatności',
	robots: { index: false, follow: false },
};

export default function AdminPrivacyPolicyPage() {
	return <AdminPrivacyPolicyView />;
}
