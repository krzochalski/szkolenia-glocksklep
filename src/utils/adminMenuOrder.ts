import type { AdminNavItem } from '@constants/adminNav';

/**
 * Apply a saved menu-order id list onto the default admin nav.
 * Unknown ids are dropped; missing known ids are appended in default order.
 */
export const orderAdminNav = (
	items: readonly AdminNavItem[],
	savedOrder: readonly string[] | null | undefined
): AdminNavItem[] => {
	if (!savedOrder?.length) return [...items];

	const byId = new Map(items.map((item) => [item.id, item]));
	const ordered: AdminNavItem[] = [];
	const seen = new Set<string>();

	for (const id of savedOrder) {
		const item = byId.get(id);
		if (!item || seen.has(id)) continue;
		ordered.push(item);
		seen.add(id);
	}

	for (const item of items) {
		if (seen.has(item.id)) continue;
		ordered.push(item);
	}

	return ordered;
};
