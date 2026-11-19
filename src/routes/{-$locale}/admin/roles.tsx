import { createFileRoute } from "@tanstack/react-router";
import { adminRouteFeedback } from "@/components/admin/admin-route-feedback";
import { RolesWorkspace } from "@/components/admin/roles-workspace";
import { AppShell } from "@/components/layout/app-shell";
import {
	getMessageNamespace,
	type Locale,
	normalizeLocale,
} from "@/i18n/messages";
import type { UsersRbacSnapshot } from "@/server/db/repositories/users-rbac.repository";
import { getUsersRbac } from "@/server/functions/users-rbac";

export const Route = createFileRoute("/{-$locale}/admin/roles")({
	...adminRouteFeedback,
	loader: () =>
		getUsersRbac({ data: { includeRoleUsers: true, pageSize: 100 } }),
	component: AdminRolesPage,
});
function AdminRolesPage() {
	const snapshot = Route.useLoaderData();
	const { locale } = Route.useParams();
	return (
		<AdminRolesView locale={normalizeLocale(locale)} snapshot={snapshot} />
	);
}
export function AdminRolesView({
	locale = "en",
	snapshot,
}: {
	locale?: Locale;
	snapshot: UsersRbacSnapshot;
}) {
	const copy = getMessageNamespace(locale, "rolesCopy");
	return (
		<AppShell
			activeNav="Roles"
			currentPage={copy.currentPage}
			locale={locale}
			mode="admin"
		>
			<RolesWorkspace locale={locale} snapshot={snapshot} />
		</AppShell>
	);
}
