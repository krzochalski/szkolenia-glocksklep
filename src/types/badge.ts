/** Custom achievement badge definition (admin catalogue). */
export type Badge = {
	id: string;
	name: string;
	slug: string;
	/** Optional short description shown in admin. */
	description?: string;
	/** Public image path, e.g. `/badges/….webp` or `/thumbnails/….webp`. */
	image: string;
};

/** Admin-assigned custom badge on a user. */
export type AwardedBadge = {
	badgeId: string;
	badgeName: string;
	badgeImage: string;
	/** ISO timestamp or `YYYY-MM-DD` when awarded. */
	awardedAt: string;
	markedBy: string;
	markedAt: string;
};
