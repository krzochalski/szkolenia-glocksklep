import type { CourseClass } from '@/types/course';

/** Strips undefined values from a CourseClass for Firestore writes. */
export const cleanDateForFirestore = (d: CourseClass): Record<string, unknown> => {
	const clean: Record<string, unknown> = {
		id: d.id,
		slotsMax: d.slotsMax,
		date: d.date,
		timeStart: d.timeStart,
		participants: (d.participants ?? []).map((p) => {
			const cp: Record<string, unknown> = {
				id: p.id,
				name: p.name,
				email: p.email,
			};
			if (p.phoneNumber) cp.phoneNumber = p.phoneNumber;
			if (p.paid != null) cp.paid = p.paid;
			if (p.paysByCash != null) cp.paysByCash = p.paysByCash;
			return cp;
		}),
	};
	if (d.instructor) {
		const inst: Record<string, unknown> = {};
		if (d.instructor.id) inst.id = d.instructor.id;
		if (d.instructor.name) inst.name = d.instructor.name;
		if (d.instructor.slug) inst.slug = d.instructor.slug;
		if (d.instructor.bio) inst.bio = d.instructor.bio;
		if (d.instructor.email) inst.email = d.instructor.email;
		if (Object.keys(inst).length > 0) clean.instructor = inst;
	}
	if (d.place) {
		const pl: Record<string, unknown> = {};
		if (d.place.id) pl.id = d.place.id;
		if (d.place.name) pl.name = d.place.name;
		if (d.place.slug) pl.slug = d.place.slug;
		if (d.place.googleMapsLink) pl.googleMapsLink = d.place.googleMapsLink;
		if (d.place.link) pl.link = d.place.link;
		if (Object.keys(pl).length > 0) clean.place = pl;
	}
	if (d.customPrice != null) clean.customPrice = d.customPrice;
	if (d.canceled) clean.canceled = true;
	return clean;
};
