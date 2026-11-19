import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "../../../components/auth/auth-page";
import {
	getDictionary,
	type Locale,
	normalizeLocale,
} from "../../../i18n/messages";
import { toSafeRelativePath } from "../../../lib/safe-redirect";

export const Route = createFileRoute("/{-$locale}/auth/sign-up")({
	// A buyer who has no account yet arrives here from sign-in; the page to
	// return to travels with them. Only a site-relative path is honoured.
	validateSearch: (search: Record<string, unknown>) => ({
		redirectTo: toSafeRelativePath(search.redirectTo, "") || undefined,
	}),
	// The page title follows the locale; the shared page renders from the /auth layout.
	head: ({ params }) => ({
		meta: [
			{
				title: getDictionary(normalizeLocale(params.locale)).t(
					"auth.signUp.title",
				),
			},
		],
	}),
	component: SignUp,
});

// The /auth layout renders the shared page for this URL, so the tab group and
// form drafts persist across sign-in and sign-up; this leaf keeps it addressable.
function SignUp() {
	return null;
}

export function SignUpView({
	locale = "en",
	redirectTo,
}: {
	locale?: Locale;
	redirectTo?: string;
}) {
	return <AuthPage mode="sign-up" locale={locale} redirectTo={redirectTo} />;
}
