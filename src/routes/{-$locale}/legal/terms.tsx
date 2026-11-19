import { createFileRoute, redirect } from "@tanstack/react-router";
import { normalizeLocale, localizedPath } from "@/i18n/messages";

export const Route = createFileRoute("/{-$locale}/legal/terms")({
	beforeLoad: ({ params }) => {
		throw redirect({
			href: localizedPath("/terms", normalizeLocale(params.locale)),
		});
	},
});
