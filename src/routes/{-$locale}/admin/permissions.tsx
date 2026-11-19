import { createFileRoute } from "@tanstack/react-router";
import { PermissionsDirectory } from "@/components/admin/access-directories";
import { adminRouteFeedback } from "@/components/admin/admin-route-feedback";
import { AppShell } from "@/components/layout/app-shell";
import {
	getMessageNamespace,
	type Locale,
	normalizeLocale,
} from "@/i18n/messages";
import type { UsersRbacSnapshot as Snapshot } from "@/server/db/repositories/users-rbac.repository";
import { getAdminPermissionDirectory } from "@/server/functions/users-rbac";

export const Route = createFileRoute("/{-$locale}/admin/permissions")({
	...adminRouteFeedback,
	loader: () => getAdminPermissionDirectory(),
	component: AdminPermissionsPage,
});

function AdminPermissionsPage() {
	const snapshot = Route.useLoaderData();
	const { locale } = Route.useParams();
	return (
		<AdminPermissionsView
			locale={normalizeLocale(locale)}
			snapshot={snapshot}
		/>
	);
}
export function AdminPermissionsView({
	locale = "en",
	snapshot,
}: {
	locale?: Locale;
	snapshot: Pick<Snapshot, "permissions">;
}) {
	const copy = getMessageNamespace(locale, "permissionsCopy");
	return (
		<AppShell
			activeNav="Admin"
			currentPage={copy.currentPage}
			locale={locale}
			mode="admin"
		>
			<PermissionsDirectory
				locale={locale}
				permissions={snapshot.permissions}
			/>
		</AppShell>
	);
}
