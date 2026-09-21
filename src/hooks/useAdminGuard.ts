import { useEffect, useState } from 'react';

import { isUserAdmin } from '@/services/admins';
import { onAuthStateChange } from '@/services/auth';

type AdminGuardResult = {
	isAdmin: boolean;
	loading: boolean;
};

export const useAdminGuard = (): AdminGuardResult => {
	const [isAdmin, setIsAdmin] = useState(false);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		return onAuthStateChange(async (user) => {
			if (!user) {
				setIsAdmin(false);
				setLoading(false);
				return;
			}
			try {
				const admin = await isUserAdmin(user.uid);
				setIsAdmin(admin);
			} catch {
				setIsAdmin(false);
			}
			setLoading(false);
		});
	}, []);

	return { isAdmin, loading };
};
