import { AdminBillingDataView } from '@views/Admin/AdminBillingDataView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Admin — dane rozliczeniowe',
	robots: { index: false, follow: false },
};

export default function AdminBillingDataPage() {
	return <AdminBillingDataView />;
}
