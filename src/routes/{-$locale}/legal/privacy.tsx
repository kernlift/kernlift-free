import { createFileRoute, redirect } from "@tanstack/react-router";
import { normalizeLocale, localizedPath } from "@/i18n/messages";

export const Route = createFileRoute("/{-$locale}/legal/privacy")({
	beforeLoad: ({ params }) => {
		throw redirect({
			href: localizedPath("/privacy", normalizeLocale(params.locale)),
		});
	},
});
