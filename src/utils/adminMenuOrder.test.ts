import { describe, expect, it } from 'vitest';
import type { AdminNavItem } from '@constants/adminNav';
import { orderAdminNav } from './adminMenuOrder';

const items: AdminNavItem[] = [
	{ id: 'a', label: 'A', href: '/a' },
	{ id: 'b', label: 'B', href: '/b' },
	{ id: 'c', label: 'C', href: '/c' },
];

describe('orderAdminNav', () => {
	it('returns default order when saved order is empty', () => {
		expect(orderAdminNav(items, null).map((i) => i.id)).toEqual(['a', 'b', 'c']);
		expect(orderAdminNav(items, []).map((i) => i.id)).toEqual(['a', 'b', 'c']);
	});

	it('reorders known ids and appends missing ones', () => {
		expect(orderAdminNav(items, ['c', 'a']).map((i) => i.id)).toEqual(['c', 'a', 'b']);
	});

	it('drops unknown ids and duplicates', () => {
		expect(orderAdminNav(items, ['c', 'x', 'c', 'b']).map((i) => i.id)).toEqual([
			'c',
			'b',
			'a',
		]);
	});
});
