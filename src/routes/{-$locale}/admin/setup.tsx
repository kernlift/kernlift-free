import { createFileRoute, redirect } from "@tanstack/react-router";
import { normalizeLocale, localizedPath } from "@/i18n/messages";

export const Route = createFileRoute("/{-$locale}/admin/setup")({
	beforeLoad: ({ params }) => {
		throw redirect({
			href: localizedPath("/setup", normalizeLocale(params.locale)),
		});
	},
});
