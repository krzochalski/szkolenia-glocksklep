export type HomepageMissionPoint = {
	id: string;
	title: string;
	body: string;
};

export type HomepageWayOfWorking = {
	id: string;
	title: string;
	description: string;
};

export type HomepageDocument = {
	heroHeadline: string;
	heroSubline: string;
	heroImage: string;
	/** Section directly under the hero: title, subtitle, markdown body, banner. */
	introTitle: string;
	introSubline: string;
	introMarkdown: string;
	introBannerImage: string;
	missionTitle: string;
	/** @deprecated Prefer `missionPoints`; kept in sync for older CMS docs. */
	missionBody: string;
	missionPoints: HomepageMissionPoint[];
	waysOfWorking: HomepageWayOfWorking[];
	growthPathTeaser: string;
	privateIndividualTitle: string;
	privateIndividualBody: string;
	privateGroupTitle: string;
	privateGroupBody: string;
	updatedAt?: string;
};

export type HomepageWritable = Omit<HomepageDocument, 'updatedAt'>;
