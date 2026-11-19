import {
	adminNavItems,
	allowedShellItems,
	activeShellItem,
} from "@/components/layout/app-shell-navigation";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AuthProvider } from "@/components/auth/auth-context";
import { getAuthSnapshot } from "@/server/functions/session-guard";
import { localizedPath, normalizeLocale } from "@/i18n/messages";
export const Route = createFileRoute("/{-$locale}/admin")({
	beforeLoad: async ({ params, location }) => {
		const auth = await getAuthSnapshot(),
			locale = normalizeLocale(params.locale);
		if (auth.status !== "authenticated")
			throw redirect({ href: localizedPath("/auth/sign-in", locale) });
		if (!auth.canAccessAdmin)
			throw redirect({
				href: localizedPath("/system/permission-denied", locale),
			});
		const active = activeShellItem(
			adminNavItems,
			location.pathname.replace(
				/\/admin\/(settings|setup)\/?$/,
				"/admin/config/auth",
			),
			locale,
		);
		if (active?.permission && !auth.permissions.includes(active.permission)) {
			const first = allowedShellItems(adminNavItems, auth.permissions)[0];
			const dashboard =
				location.pathname.replace(/\/$/, "") ===
				localizedPath("/admin", locale);
			throw redirect({
				href: localizedPath(
					dashboard && first ? first.to : "/system/permission-denied",
					locale,
				),
			});
		}
		return { auth };
	},
	component: Layout,
});
function Layout() {
	const { auth } = Route.useRouteContext();
	return (
		<AuthProvider snapshot={auth}>
			<Outlet />
		</AuthProvider>
	);
}
