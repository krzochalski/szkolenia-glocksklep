import { SzkolenieSzczegolyView } from '@views/Profil/SzkolenieSzczegolyView';
import type { Metadata } from 'next';

type Props = {
	params: Promise<{ slug: string; dateId: string }>;
};

export const metadata: Metadata = {
	title: 'Szczegóły szkolenia',
};

export default async function SzkolenieSzczegolyPage({ params }: Props) {
	const { slug, dateId } = await params;
	return <SzkolenieSzczegolyView slug={slug} dateId={dateId} />;
}
