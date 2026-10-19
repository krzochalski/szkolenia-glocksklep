/** Pixel-art for homepage „Sposób pracy” intro points, keyed by mission point id. */
export const HOMEPAGE_MISSION_ART: Readonly<Record<string, string>> = {
	'small-groups': '/homepage/ways/mission-small-groups.webp',
	reps: '/homepage/ways/mission-reps.webp',
	practical: '/homepage/ways/mission-practical.webp',
};

/** Pixel-art for homepage „Sposób pracy” feature tiles, keyed by way id. */
export const HOMEPAGE_WAY_ART: Readonly<Record<string, string>> = {
	practice: '/homepage/ways/practice.webp',
	'own-gun': '/homepage/ways/own-gun.webp',
	path: '/homepage/ways/path.webp',
	debrief: '/homepage/ways/debrief.webp',
	'materials-training': '/homepage/ways/materials-training.webp',
};

const FALLBACK_WAY_ART = Object.values(HOMEPAGE_WAY_ART);
const FALLBACK_MISSION_ART = Object.values(HOMEPAGE_MISSION_ART);

export const wayArtSrc = (wayId: string, index: number): string =>
	HOMEPAGE_WAY_ART[wayId] ?? FALLBACK_WAY_ART[index % FALLBACK_WAY_ART.length] ?? FALLBACK_WAY_ART[0];

export const missionArtSrc = (pointId: string, index: number): string =>
	HOMEPAGE_MISSION_ART[pointId] ??
	FALLBACK_MISSION_ART[index % FALLBACK_MISSION_ART.length] ??
	FALLBACK_MISSION_ART[0];
