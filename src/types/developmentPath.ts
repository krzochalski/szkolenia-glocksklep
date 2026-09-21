export type DevelopmentPathStep = {
	id: string;
	courseSlug: string;
	label?: string;
};

/** One vertical stage in a track; can hold several courses side by side. */
export type DevelopmentPathLevel = {
	id: string;
	items: DevelopmentPathStep[];
};

export type DevelopmentPathTrack = {
	id: string;
	title: string;
	levels: DevelopmentPathLevel[];
};

export type DevelopmentPathDocument = {
	intro: string;
	paths: DevelopmentPathTrack[];
	updatedAt?: string;
};
