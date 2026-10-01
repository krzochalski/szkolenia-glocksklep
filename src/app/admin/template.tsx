import type { ReactNode } from 'react';
import { PageMotion } from '@/components/PageMotion';

type AdminTemplateProps = {
	readonly children: ReactNode;
};

export default function AdminTemplate({ children }: AdminTemplateProps) {
	return <PageMotion>{children}</PageMotion>;
}
