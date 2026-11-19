import { createFileRoute, redirect } from "@tanstack/react-router";
import { normalizeLocale, localizedPath } from "@/i18n/messages";

export const Route = createFileRoute("/{-$locale}/admin/users/")({
	beforeLoad: ({ params }) => {
		throw redirect({
			href: localizedPath(
				"/admin/users/dashboard",
				normalizeLocale(params.locale),
			),
		});
	},
});
