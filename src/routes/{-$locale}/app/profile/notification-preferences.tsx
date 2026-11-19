import { createFileRoute, redirect } from "@tanstack/react-router";
import { localePathPrefix, normalizeLocale } from "../../../../i18n/messages";

export const Route = createFileRoute(
	"/{-$locale}/app/profile/notification-preferences",
)({
	beforeLoad: ({ params }) => {
		const prefix = localePathPrefix(normalizeLocale(params.locale));
		throw redirect({ href: `${prefix}/app/profile#profile-notifications` });
	},
});
