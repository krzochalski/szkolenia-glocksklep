import type { ReactNode } from 'react';
import { PageMotion } from '@/components/PageMotion';

type PublicTemplateProps = {
	readonly children: ReactNode;
};

export default function PublicTemplate({ children }: PublicTemplateProps) {
	return <PageMotion>{children}</PageMotion>;
}
