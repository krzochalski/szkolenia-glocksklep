'use client';

import { auth } from '@services/auth';
import { queryClient } from '@services/queryClient';
import { useEffect, useState } from 'react';
import {
	clearChunkReloadGuard,
	fetchRemoteBuildId,
	getRunningBuildId,
	isChunkLoadFailure,
	isNewerBuildAvailable,
	shouldReloadForChunkError,
} from '@/utils/appVersion';
import { runResumeSync } from '@/utils/resumeSync';
import { setupQueryFocusManager } from '@/utils/setupQueryFocusManager';

const VERSION_POLL_MS = 5 * 60 * 1000;

export type AppFreshnessState = {
	readonly updateAvailable: boolean;
	readonly offline: boolean;
	readonly reloadForUpdate: () => void;
};

export const useAppFreshness = (): AppFreshnessState => {
	const [updateAvailable, setUpdateAvailable] = useState(false);
	const [offline, setOffline] = useState(
		() => typeof navigator !== 'undefined' && navigator.onLine === false
	);

	useEffect(() => {
		clearChunkReloadGuard();
		const teardownFocus = setupQueryFocusManager();

		const checkVersion = async () => {
			const remote = await fetchRemoteBuildId();
			if (isNewerBuildAvailable(getRunningBuildId(), remote)) {
				setUpdateAvailable(true);
			}
		};

		const onResume = () => {
			if (document.visibilityState && document.visibilityState !== 'visible') return;
			void runResumeSync({ queryClient, auth });
			void checkVersion();
		};

		const onPageShow = (event: PageTransitionEvent) => {
			if (event.persisted) {
				void runResumeSync({ queryClient, auth });
				void checkVersion();
			}
		};

		const onOnline = () => {
			setOffline(false);
			void runResumeSync({ queryClient, auth });
		};

		const onOffline = () => {
			setOffline(true);
		};

		const onUnhandledRejection = (event: PromiseRejectionEvent) => {
			if (!isChunkLoadFailure(event.reason)) return;
			if (shouldReloadForChunkError()) {
				window.location.reload();
			}
		};

		const onError = (event: ErrorEvent) => {
			if (!isChunkLoadFailure(event.error ?? event.message)) return;
			if (shouldReloadForChunkError()) {
				window.location.reload();
			}
		};

		document.addEventListener('visibilitychange', onResume);
		window.addEventListener('pageshow', onPageShow);
		window.addEventListener('online', onOnline);
		window.addEventListener('offline', onOffline);
		window.addEventListener('unhandledrejection', onUnhandledRejection);
		window.addEventListener('error', onError);

		void checkVersion();
		const intervalId = window.setInterval(() => {
			void checkVersion();
		}, VERSION_POLL_MS);

		return () => {
			teardownFocus();
			document.removeEventListener('visibilitychange', onResume);
			window.removeEventListener('pageshow', onPageShow);
			window.removeEventListener('online', onOnline);
			window.removeEventListener('offline', onOffline);
			window.removeEventListener('unhandledrejection', onUnhandledRejection);
			window.removeEventListener('error', onError);
			window.clearInterval(intervalId);
		};
	}, []);

	return {
		updateAvailable,
		offline,
		reloadForUpdate: () => {
			window.location.reload();
		},
	};
};
