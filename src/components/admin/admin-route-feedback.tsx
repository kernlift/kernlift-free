import { useRouter, useRouterState } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { StatefulButton } from "@/components/motion/button/stateful";
import { Loader } from "@/components/motion/loader";
import { adminWorkspaceMessages } from "@/i18n/admin-workspace";
import { normalizeLocale } from "@/i18n/messages";

function useRouteLocale() {
	return useRouterState({
		select: (state) => normalizeLocale(state.location.pathname.split("/")[1]),
	});
}

export function AdminRoutePending() {
	const locale = useRouteLocale();
	const copy = adminWorkspaceMessages[locale];
	return (
		<AppShell
			mode="admin"
			activeNav="Admin"
			currentPage={copy.pageLoading}
			locale={locale}
		>
			<div className="flex min-w-0 items-center gap-3 py-6">
				<Loader size={24} label={copy.pageLoading} />
			</div>
		</AppShell>
	);
}

/** Recovery re-runs route reads at the current URL, never a preceding form submission. */
export function AdminRouteError() {
	const locale = useRouteLocale();
	const router = useRouter();
	const copy = adminWorkspaceMessages[locale];
	const busy = useRef(false);
	const [pending, setPending] = useState(false);

	async function retry() {
		if (busy.current) return;
		busy.current = true;
		setPending(true);
		try {
			// invalidate clears failed loader matches and resets render error boundaries.
			// ErrorComponent's reset prop is absent for loader failures in this router version.
			await router.invalidate({ sync: true });
		} catch {
			// Keep the localized recovery state; never expose a raw database/provider exception.
		} finally {
			busy.current = false;
			setPending(false);
		}
	}

	return (
		<AppShell
			mode="admin"
			activeNav="Admin"
			currentPage={copy.pageLoadFailed}
			locale={locale}
		>
			<div className="grid min-w-0 justify-items-start gap-4">
				<p role="alert" className="m-0 text-sm leading-6 text-muted-foreground">
					{copy.pageLoadRecovery}
				</p>
				<StatefulButton
					type="button"
					state={pending ? "loading" : "idle"}
					loadingText={copy.retryingPage}
					disabled={pending}
					onClick={() => void retry()}
				>
					{copy.retryPage}
				</StatefulButton>
			</div>
		</AppShell>
	);
}

// Apply at each admin match: loader errors use that match's own error component,
// and pending UI does not inherit from the parent route in TanStack Router.
export const adminRouteFeedback = {
	errorComponent: AdminRouteError,
	pendingComponent: AdminRoutePending,
	pendingMs: 200,
	pendingMinMs: 0,
};
