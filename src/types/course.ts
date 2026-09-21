export interface Participant {
	/* Unique ID of the participant from firebase users */
	id: string;
	/* User name */
	name: string;
	/* Email of the participant */
	email: string;
	/* Phone number of the participant */
	phoneNumber?: string;
	/* Whether the participant has paid for the class */
	paid?: boolean;
	/* Whether the participant declares cash payment for the class */
	paysByCash?: boolean;
}

export interface Course {
	id: string;
	/* Name of the class */
	name: string;
	/* Name of the class in slug format */
	slug: string;
	/* Short description of the class */
	description: string;
	/* Price of the class in PLN, decimal */
	price: number;
	/* How many hours will the class last */
	hours: number;
	/* Tags for this date */
	tags: string[];
	/* Level of proficiency for this date */
	level: 'basic' | 'intermediate' | 'advanced';
	dates?: CourseClass[];
}

export interface CourseClass {
	id: string;
	/* Maximum number of students of the class */
	slotsMax: number;
	/* Date in format YYYY-MM-DD */
	date: string;
	/* Time in format HH:MM */
	timeStart: string;
	/* Participants of the class */
	participants: Participant[];
	instructor: Instructor;
	place: Place;
	customPrice?: number;
	/* Whether the class has been canceled by admin */
	canceled?: boolean;
}

export interface Place {
	id: string;
	name: string;
	link?: string;
	googleMapsLink: string;
	slug: string;
}

export interface Tag {
	id: string;
	name: string;
	slug: string;
}

export interface Instructor {
	id: string;
	name: string;
	slug: string;
	bio: string;
	email?: string;
}
