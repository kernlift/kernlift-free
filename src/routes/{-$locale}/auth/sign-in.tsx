import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "../../../components/auth/auth-page";
import {
	getDictionary,
	type Locale,
	normalizeLocale,
} from "../../../i18n/messages";
import { toSafeRelativePath } from "../../../lib/safe-redirect";

export const Route = createFileRoute("/{-$locale}/auth/sign-in")({
	// Anything that sends a visitor here to finish what they started — the buy
	// button on a product page, a guarded route — passes the page to come back
	// to. Only a site-relative path survives validation, so the parameter cannot
	// be used to bounce a signed-in user to another origin.
	validateSearch: (search: Record<string, unknown>) => ({
		redirectTo: toSafeRelativePath(search.redirectTo, "") || undefined,
	}),
	// The page title follows the locale; the shared page renders from the /auth layout.
	head: ({ params }) => ({
		meta: [
			{
				title: getDictionary(normalizeLocale(params.locale)).t(
					"auth.signIn.title",
				),
			},
		],
	}),
	component: SignIn,
});

// The /auth layout renders the shared page for this URL, so the tab group and
// form drafts persist across sign-in and sign-up; this leaf keeps it addressable.
function SignIn() {
	return null;
}

export function SignInView({
	locale = "en",
	redirectTo,
}: {
	locale?: Locale;
	redirectTo?: string;
}) {
	return <AuthPage mode="sign-in" locale={locale} redirectTo={redirectTo} />;
}
