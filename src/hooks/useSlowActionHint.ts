'use client';

import { useEffect, useState } from 'react';

/** True after `delayMs` while `active` stays true; resets when inactive. */
export const useSlowActionHint = (active: boolean, delayMs = 4000): boolean => {
	const [show, setShow] = useState(false);

	useEffect(() => {
		if (!active) {
			setShow(false);
			return;
		}
		const id = window.setTimeout(() => setShow(true), delayMs);
		return () => window.clearTimeout(id);
	}, [active, delayMs]);

	return show;
};
