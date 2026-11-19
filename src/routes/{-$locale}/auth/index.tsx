import { createFileRoute, redirect } from "@tanstack/react-router";
import { localePathPrefix, normalizeLocale } from "../../../i18n/messages";

/** `/auth` has no page of its own; it is the sign-in entry. */
export const Route = createFileRoute("/{-$locale}/auth/")({
	beforeLoad: ({ params }) => {
		throw redirect({
			href: `${localePathPrefix(normalizeLocale(params.locale))}/auth/sign-in`,
		});
	},
});
