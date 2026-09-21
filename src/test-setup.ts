import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, vi } from 'vitest';
import { setMockPathname } from './test-next-nav';

afterEach(() => {
	cleanup();
	setMockPathname('/');
});

vi.mock('next/navigation', async () => {
	const { navState } = await import('./test-next-nav');
	return {
		usePathname: () => navState.pathname,
		useRouter: () => ({
			push: vi.fn(),
			replace: vi.fn(),
			prefetch: vi.fn(),
			back: vi.fn(),
		}),
		useParams: () => ({}),
		useSearchParams: () => new URLSearchParams(),
	};
});

vi.mock('next/link', () => ({
	default: ({
		href,
		children,
		...props
	}: {
		href: string;
		children?: unknown;
		[key: string]: unknown;
	}) => createElement('a', { href, ...props }, children as never),
}));
