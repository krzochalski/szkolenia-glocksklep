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
			if (p.customPrice != null) cp.customPrice = p.customPrice;
			if (p.customPriceNote) cp.customPriceNote = p.customPriceNote;
			if (p.customPriceUpdatedAt) cp.customPriceUpdatedAt = p.customPriceUpdatedAt;
			if (p.customPriceUpdatedBy) cp.customPriceUpdatedBy = p.customPriceUpdatedBy;
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
		const maps = (d.place.googleMapsLink ?? d.place.link ?? '').trim();
		if (maps) {
			pl.googleMapsLink = maps;
			pl.link = maps;
		}
		if (Object.keys(pl).length > 0) clean.place = pl;
	}
	if (d.customPrice != null) clean.customPrice = d.customPrice;
	const subtitle = d.subtitle?.trim();
	if (subtitle) clean.subtitle = subtitle;
	if (d.canceled) clean.canceled = true;
	if (typeof d.minParticipants === 'number' && d.minParticipants >= 1) {
		clean.minParticipants = Math.floor(d.minParticipants);
	}
	const minDecisionBy = d.minDecisionBy?.trim();
	if (minDecisionBy) clean.minDecisionBy = minDecisionBy;
	if (d.runConfirmedDespiteMin === true) clean.runConfirmedDespiteMin = true;
	return clean;
};
