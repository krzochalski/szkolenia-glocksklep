import { useEffect, useState } from 'react';

import { isUserAdmin } from '@/services/admins';
import { onAuthStateChange } from '@/services/auth';

export const useIsAdmin = (): boolean => {
	const [isAdmin, setIsAdmin] = useState(false);

	useEffect(() => {
		return onAuthStateChange(async (user) => {
			if (!user) {
				setIsAdmin(false);
				return;
			}
			try {
				const admin = await isUserAdmin(user.uid);
				setIsAdmin(admin);
			} catch {
				setIsAdmin(false);
			}
		});
	}, []);

	return isAdmin;
};
