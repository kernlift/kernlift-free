import { createFileRoute } from "@tanstack/react-router";
import { AuditDirectory } from "@/components/admin/access-directories";
import { adminRouteFeedback } from "@/components/admin/admin-route-feedback";
import { AppShell } from "@/components/layout/app-shell";
import {
	getMessageNamespace,
	type Locale,
	normalizeLocale,
} from "@/i18n/messages";
import type { SecurityAuditSnapshot as Snapshot } from "@/server/db/repositories/security-audit.repository";
import { getSecurityAudit } from "@/server/functions/security-audit";

export const Route = createFileRoute("/{-$locale}/admin/audit")({
	...adminRouteFeedback,
	loader: () => getSecurityAudit(),
	component: AdminAuditPage,
});

function AdminAuditPage() {
	const snapshot = Route.useLoaderData();
	const { locale } = Route.useParams();
	return (
		<AdminAuditView locale={normalizeLocale(locale)} snapshot={snapshot} />
	);
}
export function AdminAuditView({
	locale = "en",
	snapshot,
}: {
	locale?: Locale;
	snapshot: Snapshot;
}) {
	const copy = getMessageNamespace(locale, "auditCopy");
	return (
		<AppShell
			activeNav="Admin"
			currentPage={copy.currentPage}
			locale={locale}
			mode="admin"
		>
			<AuditDirectory locale={locale} snapshot={snapshot} />
		</AppShell>
	);
}
