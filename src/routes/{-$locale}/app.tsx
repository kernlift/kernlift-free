import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AuthProvider } from "@/components/auth/auth-context";
import { getAuthSnapshot } from "@/server/functions/session-guard";
import { localizedPath, normalizeLocale } from "@/i18n/messages";
export const Route = createFileRoute("/{-$locale}/app")({
	beforeLoad: async ({ params }) => {
		const auth = await getAuthSnapshot(),
			locale = normalizeLocale(params.locale);
		if (auth.status !== "authenticated")
			throw redirect({ href: localizedPath("/auth/sign-in", locale) });

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
