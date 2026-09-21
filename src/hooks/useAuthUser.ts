import type { User } from 'firebase/auth';
import { useEffect, useState } from 'react';

import { getCurrentUser, onAuthStateChange } from '@/services/auth';

export const useAuthUser = (): User | null => {
	const [user, setUser] = useState<User | null>(getCurrentUser());

	useEffect(() => {
		return onAuthStateChange(setUser);
	}, []);

	return user;
};
