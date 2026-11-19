import { createFileRoute, redirect } from "@tanstack/react-router";
import { normalizeLocale, localizedPath } from "@/i18n/messages";

export const Route = createFileRoute("/{-$locale}/admin/settings")({
	beforeLoad: ({ params }) => {
		throw redirect({
			href: localizedPath("/admin/config/auth", normalizeLocale(params.locale)),
		});
	},
});
