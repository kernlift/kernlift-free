import { RefreshCcw } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/motion/button";
import { Loader } from "@/components/motion/loader";
import { getDictionary, type Locale } from "../../i18n/messages";
import { useAuth } from "../auth/auth-state";
import { RecoveryContent } from "./recovery";
import type { AppConsoleActive } from "./app-console-sidebar";
import { AppConsoleLayout } from "./app-console-sidebar";

type ProgressiveRouteState<T> =
	| { status: "loading" }
	| { status: "loaded"; snapshot: T }
	| { status: "error" };

const progressiveRouteCache = new Map<
	string,
	{ expiresAt: number; promise: Promise<unknown>; routeKey: string }
>();
const progressiveRouteInvalidationListeners = new Set<
	(routeKey: string) => void
>();

export function invalidateProgressiveRouteData(
	routeKey: string,
	options: { refreshMounted?: boolean } = {},
) {
	for (const [scopedKey, entry] of progressiveRouteCache) {
		if (
			entry.routeKey === routeKey ||
			entry.routeKey.startsWith(`${routeKey}:`)
		) {
			progressiveRouteCache.delete(scopedKey);
		}
	}
	// A mutation dialog may refresh its own snapshot while preserving the success receipt.
	if (options.refreshMounted !== false)
		for (const listener of progressiveRouteInvalidationListeners)
			listener(routeKey);
}

export function useProgressiveRouteData<T>(
	cacheKey: string,
	load: () => Promise<T>,
): { retry: () => void; state: ProgressiveRouteState<T> } {
	const { user } = useAuth();
	const scopedCacheKey = `${user?.id ?? "anonymous"}:${cacheKey}`;
	const [requestVersion, setRequestVersion] = useState(0);
	const [state, setState] = useState<ProgressiveRouteState<T>>({
		status: "loading",
	});

	useEffect(() => {
		const invalidate = (invalidatedRouteKey: string) => {
			if (
				cacheKey === invalidatedRouteKey ||
				cacheKey.startsWith(`${invalidatedRouteKey}:`)
			) {
				setRequestVersion((version) => version + 1);
			}
		};
		progressiveRouteInvalidationListeners.add(invalidate);
		return () => {
			progressiveRouteInvalidationListeners.delete(invalidate);
		};
	}, [cacheKey]);

	useEffect(() => {
		let cancelled = false;
		setState({ status: "loading" });
		const cached = progressiveRouteCache.get(scopedCacheKey);
		const refresh = requestVersion > 0;
		const promise =
			!refresh && cached && cached.expiresAt > Date.now()
				? (cached.promise as Promise<T>)
				: load();
		progressiveRouteCache.set(scopedCacheKey, {
			expiresAt: Date.now() + 30_000,
			promise,
			routeKey: cacheKey,
		});
		void promise
			.then((snapshot) => {
				if (!cancelled) setState({ snapshot, status: "loaded" });
			})
			.catch(() => {
				progressiveRouteCache.delete(scopedCacheKey);
				if (!cancelled) setState({ status: "error" });
			});
		return () => {
			cancelled = true;
		};
	}, [cacheKey, load, requestVersion, scopedCacheKey]);

	const retry = useCallback(
		() => setRequestVersion((version) => version + 1),
		[],
	);
	return { retry, state };
}

export function AppRouteLoading({
	active,
	locale,
}: {
	active: AppConsoleActive;
	locale: Locale;
}) {
	const { t } = getDictionary(locale);
	return (
		<AppConsoleLayout active={active} locale={locale}>
			<div className="flex min-h-64 w-full flex-col items-center justify-center gap-4">
				<Loader variant="dots" size={24} label={t("appConsole.loading")} />
				<p aria-hidden className="text-sm leading-6 text-muted-foreground">
					{t("appConsole.loading")}
				</p>
			</div>
		</AppConsoleLayout>
	);
}

export function AppRouteError({
	active,
	locale,
	retry,
}: {
	active: AppConsoleActive;
	locale: Locale;
	retry: () => void;
}) {
	const { t } = getDictionary(locale);
	const action: ReactNode = (
		<Button onClick={retry} type="button" variant="outline">
			<RefreshCcw aria-hidden="true" className="size-4" />
			{t("appConsole.retry")}
		</Button>
	);
	return (
		<AppConsoleLayout active={active} locale={locale}>
			<RecoveryContent
				action={action}
				description={t("appConsole.loadErrorDescription")}
				title={t("appConsole.loadError")}
			/>
		</AppConsoleLayout>
	);
}
