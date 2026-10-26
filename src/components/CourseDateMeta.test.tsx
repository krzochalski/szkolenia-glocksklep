import { render, screen } from '@testing-library/react';
import { UiProvider } from '@ui';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import type { CourseClass } from '@/types/course';
import { CourseDateMeta } from './CourseDateMeta';

const place = {
	id: 'p1',
	name: 'Strzelnica Czacz',
	slug: 'czacz',
	googleMapsLink: 'https://maps.google.com/?q=Czacz',
};

const slotsSource: Pick<CourseClass, 'slotsMax' | 'participants' | 'canceled'> = {
	slotsMax: 8,
	participants: [{ id: 'u1', name: 'Ada', email: 'a@b.c' }],
};

const wrap = (ui: ReactElement) => render(<UiProvider>{ui}</UiProvider>);

describe('CourseDateMeta', () => {
	it('renders stacked date/time and place link', () => {
		wrap(<CourseDateMeta date='2026-10-18' timeStart='10:00' place={place} />);

		expect(screen.getByText('18 października 2026 · 10:00')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Strzelnica Czacz' })).toHaveAttribute(
			'href',
			'https://maps.google.com/?q=Czacz'
		);
		expect(screen.queryByText(/wolne:/)).toBeNull();
	});

	it('hides date/time when hideWhen is set', () => {
		wrap(
			<CourseDateMeta
				date='2026-10-18'
				timeStart='10:00'
				place={place}
				hideWhen
				showSlots
				slotsSource={slotsSource}
			/>
		);

		expect(screen.queryByText('18 października 2026 · 10:00')).toBeNull();
		expect(screen.getByText('Strzelnica Czacz')).toBeInTheDocument();
		expect(screen.getByText('wolne: 7')).toBeInTheDocument();
	});

	it('shows canceled instead of slots', () => {
		wrap(
			<CourseDateMeta
				date='2026-10-18'
				timeStart='10:00'
				place={place}
				showSlots
				slotsSource={{ ...slotsSource, canceled: true }}
			/>
		);

		expect(screen.getByText('odwołane')).toBeInTheDocument();
		expect(screen.queryByText(/wolne:/)).toBeNull();
	});

	it('shows instructor and scarce slots on one secondary line', () => {
		wrap(
			<CourseDateMeta
				date='2026-10-18'
				timeStart='10:00'
				place={place}
				showSlots
				slotsSource={{
					slotsMax: 8,
					participants: [
						{ id: 'u1', name: 'A', email: 'a@b.c' },
						{ id: 'u2', name: 'B', email: 'b@b.c' },
						{ id: 'u3', name: 'C', email: 'c@b.c' },
						{ id: 'u4', name: 'D', email: 'd@b.c' },
						{ id: 'u5', name: 'E', email: 'e@b.c' },
						{ id: 'u6', name: 'F', email: 'f@b.c' },
					],
				}}
				showInstructor
				instructorName='Piotr "Glockacci" Krzoska'
			/>
		);

		expect(
			screen.getByText('instruktor: Piotr "Glockacci" Krzoska · wolne: 2 · ostatnie miejsca')
		).toBeInTheDocument();
	});
});
