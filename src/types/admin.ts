export type AdminSettings = {
	readonly menuOrder?: readonly string[];
};

export type AdminDoc = {
	readonly email?: string;
	readonly createdAt?: unknown;
	readonly settings?: AdminSettings;
};
