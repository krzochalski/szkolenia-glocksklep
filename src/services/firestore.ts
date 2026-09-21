import {
	getFirestore,
	initializeFirestore,
	persistentLocalCache,
	persistentMultipleTabManager,
} from 'firebase/firestore';

import { firebaseApp } from './firebase';

const createDb = () => {
	try {
		if (typeof window === 'undefined') {
			return getFirestore(firebaseApp);
		}
		return initializeFirestore(firebaseApp, {
			localCache: persistentLocalCache({
				tabManager: persistentMultipleTabManager(),
			}),
		});
	} catch {
		return getFirestore(firebaseApp);
	}
};

export const db = createDb();
