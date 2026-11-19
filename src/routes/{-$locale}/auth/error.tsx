import { createFileRoute } from "@tanstack/react-router";
import { RouterButtonLink } from "@/components/motion/button/router-link";
import { SystemStatePanel } from "@/components/system/system-state-panel";
import {
	getDictionary,
	type Locale,
	localizedPath,
	normalizeLocale,
} from "@/i18n/messages";
import { toSafeAuthReturnPath } from "@/lib/safe-redirect";

export const Route = createFileRoute("/{-$locale}/auth/error")({
	// A failed provider round trip may carry the page the visitor was heading
	// to; it is passed back to sign-in only when it is a safe relative path.
	validateSearch: (search: Record<string, unknown>) => ({
		redirectTo:
			typeof search.redirectTo === "string" ? search.redirectTo : undefined,
	}),
	component: AuthError,
});

function AuthError() {
	const { locale } = Route.useParams();
	const { redirectTo } = Route.useSearch();
	return (
		<AuthErrorView locale={normalizeLocale(locale)} redirectTo={redirectTo} />
	);
}

export function AuthErrorView({
	locale = "en",
	redirectTo,
}: {
	locale?: Locale;
	redirectTo?: string;
}) {
	const { t } = getDictionary(locale);
	const returnPath = toSafeAuthReturnPath(redirectTo, "");
	return (
		<SystemStatePanel
			locale={locale}
			severity="error"
			title={t("auth.error.title")}
			description={t("auth.error.description")}
			action={
				<RouterButtonLink
					to={localizedPath("/auth/sign-in", locale)}
					search={returnPath ? { redirectTo: returnPath } : undefined}
				>
					{t("auth.error.backToSignIn")}
				</RouterButtonLink>
			}
		/>
	);
}
