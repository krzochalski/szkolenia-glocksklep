type CourseDate = {
	id?: string;
	date?: string;
	participants?: Array<{ id?: string; paid?: boolean }>;
};

type CourseDoc = {
	dates?: CourseDate[];
};

export type NewlyPaidRegistration = {
	dateId: string;
	participantId: string;
};

export const findParticipantsNewlyPaid = (
	before: CourseDoc | undefined,
	after: CourseDoc
): NewlyPaidRegistration[] => {
	const out: NewlyPaidRegistration[] = [];
	for (const afterDate of after.dates ?? []) {
		const dateId = afterDate.id ?? afterDate.date;
		if (!dateId) continue;
		const beforeDate = (before?.dates ?? []).find(
			(d) => d.id === afterDate.id || d.date === afterDate.date
		);
		for (const p of afterDate.participants ?? []) {
			if (p.paid !== true || !p.id) continue;
			const beforeP = (beforeDate?.participants ?? []).find((bp) => bp.id === p.id);
			if (beforeP?.paid === true) continue;
			out.push({ dateId, participantId: p.id });
		}
	}
	return out;
};