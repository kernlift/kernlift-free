import {
	createFileRoute,
	Outlet,
	useRouterState,
} from "@tanstack/react-router";
import { AuthPage } from "../../components/auth/auth-page";
import { normalizeLocale } from "../../i18n/messages";

export const Route = createFileRoute("/{-$locale}/auth")({
	component: AuthRouteShell,
});

/**
 * Sign-in and sign-up share one mounted page so the tab group and form drafts
 * survive switching between the two URLs. Every other auth route renders its
 * own leaf. The public auth pages never read a session.
 */
function AuthRouteShell() {
	const { locale } = Route.useParams();
	const location = useRouterState({ select: (state) => state.location });
	const path = location.pathname.replace(/\/$/, "");
	const mode = path.endsWith("/sign-in")
		? "sign-in"
		: path.endsWith("/sign-up")
			? "sign-up"
			: null;
	if (!mode) return <Outlet />;
	// Validated (and sanitised) by the sign-in and sign-up leaves' validateSearch.
	const search: { redirectTo?: unknown } = location.search;
	const redirectTo =
		typeof search.redirectTo === "string" ? search.redirectTo : undefined;
	return (
		<AuthPage
			mode={mode}
			locale={normalizeLocale(locale)}
			redirectTo={redirectTo}
		/>
	);
}
