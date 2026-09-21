export type DevelopmentPathStep = {
	id: string;
	courseSlug: string;
	label?: string;
};

export type DevelopmentPathTrack = {
	id: string;
	title: string;
	steps: DevelopmentPathStep[];
};

export type DevelopmentPathDocument = {
	intro: string;
	paths: DevelopmentPathTrack[];
	updatedAt?: string;
};
