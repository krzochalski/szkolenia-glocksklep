export type HomepageWayOfWorking = {
	id: string;
	title: string;
	description: string;
};

export type HomepageDocument = {
	heroHeadline: string;
	heroSubline: string;
	heroImage: string;
	missionTitle: string;
	missionBody: string;
	waysOfWorking: HomepageWayOfWorking[];
	growthPathTeaser: string;
	privateIndividualTitle: string;
	privateIndividualBody: string;
	privateGroupTitle: string;
	privateGroupBody: string;
	updatedAt?: string;
};

export type HomepageWritable = Omit<HomepageDocument, 'updatedAt'>;
