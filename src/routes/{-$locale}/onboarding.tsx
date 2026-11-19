import { createFileRoute, redirect } from "@tanstack/react-router";
import { normalizeLocale, localizedPath } from "@/i18n/messages";
import { getSetup } from "@/server/functions/foundation";
import { Setup } from "@/components/settings/provider-settings";
import { getAuthSnapshot } from "@/server/functions/session-guard";
import { AuthProvider } from "@/components/auth/auth-context";

export const Route = createFileRoute("/{-$locale}/onboarding")({
	beforeLoad: async ({ params }) => {
		const auth = await getAuthSnapshot(),
			locale = normalizeLocale(params.locale);
		if (auth.status !== "authenticated")
			throw redirect({ href: localizedPath("/auth/sign-in", locale) });
		if (!auth.permissions.includes("config"))
			throw redirect({
				href: localizedPath("/system/permission-denied", locale),
			});
		return { auth };
	},
	loader: () => getSetup(),
	component: Page,
});
function Page() {
	return (
		<AuthProvider snapshot={Route.useRouteContext().auth}>
			<Setup checks={Route.useLoaderData()} onboarding={true} />
		</AuthProvider>
	);
}
