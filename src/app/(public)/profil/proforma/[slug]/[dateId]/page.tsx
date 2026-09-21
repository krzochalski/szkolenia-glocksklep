import { ProformaView } from '@views/Profil/ProformaView';
import type { Metadata } from 'next';

type Props = {
	params: Promise<{ slug: string; dateId: string }>;
};

export const metadata: Metadata = {
	title: 'Proforma',
};

export default async function ProformaPage({ params }: Props) {
	const { slug, dateId } = await params;
	return <ProformaView slug={slug} dateId={dateId} />;
}
