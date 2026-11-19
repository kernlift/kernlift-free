import { useRouter } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useAuth } from "@/components/auth/auth-state";
import { Button } from "@/components/motion/button";
import { adminEditingMessages } from "@/i18n/admin-editing";
import type { Locale } from "@/i18n/messages";

/** Refresh is separate from the write: retrying a failed refresh must not resubmit a note/revision. */
export function useAdminSave(
	permission: string,
	refreshAfterSave?: () => Promise<void>,
) {
	const { snapshot } = useAuth();
	const router = useRouter();
	const allowed =
		snapshot.status === "authenticated" &&
		snapshot.permissions.includes(permission);
	const busy = useRef(false);
	const [pending, setPending] = useState(false);
	const [result, setResult] = useState<"saved" | "failed" | null>(null);
	const [refreshFailed, setRefreshFailed] = useState(false);
	async function refreshRecords() {
		try {
			if (refreshAfterSave) await refreshAfterSave();
			else await router.invalidate({ sync: true });
			setRefreshFailed(false);
		} catch {
			setRefreshFailed(true);
		}
	}
	async function save(write: () => Promise<void>) {
		if (!allowed || busy.current || refreshFailed) return;
		busy.current = true;
		setPending(true);
		setResult(null);
		try {
			await write();
			setResult("saved");
			await refreshRecords();
		} catch {
			setResult("failed");
		} finally {
			busy.current = false;
			setPending(false);
		}
	}
	async function refresh() {
		if (busy.current) return;
		busy.current = true;
		setPending(true);
		try {
			await refreshRecords();
		} finally {
			busy.current = false;
			setPending(false);
		}
	}
	function resetFeedback() {
		if (!busy.current) setResult(null);
	}
	return {
		allowed,
		pending,
		result,
		refreshFailed,
		save,
		refresh,
		resetFeedback,
	};
}
export function AdminSaveFeedback({
	state,
	locale,
	failureMessage,
	refreshFailureMessage,
	refreshLabel,
}: {
	state: ReturnType<typeof useAdminSave>;
	locale: Locale;
	failureMessage?: string;
	refreshFailureMessage?: string;
	refreshLabel?: string;
}) {
	const copy = adminEditingMessages[locale];
	return (
		<>
			{state.result ? (
				<p
					role={state.result === "failed" ? "alert" : "status"}
					className="m-0 text-sm"
				>
					{state.result === "failed"
						? (failureMessage ?? copy.failed)
						: copy.saved}
				</p>
			) : null}
			{state.refreshFailed ? (
				<div className="grid justify-items-start gap-2">
					<p role="alert" className="m-0 text-sm">
						{refreshFailureMessage ?? copy.refreshFailed}
					</p>
					<Button
						type="button"
						variant="outline"
						disabled={state.pending}
						onClick={() => void state.refresh()}
					>
						{refreshLabel ?? copy.refresh}
					</Button>
				</div>
			) : null}
		</>
	);
}
