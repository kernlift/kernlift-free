import { BeuiLocaleProvider } from "@/components/motion/locale";
import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { isLocale, normalizeLocale } from "../i18n/messages";

export const Route = createFileRoute("/{-$locale}")({
	beforeLoad: ({ params }) => {
		if (params.locale && !isLocale(params.locale)) {
			throw notFound();
		}

		return { locale: normalizeLocale(params.locale) };
	},
	component: LocaleRouteShell,
});

function LocaleRouteShell() {
	return (
		<BeuiLocaleProvider locale={Route.useRouteContext().locale}>
			<Outlet />
		</BeuiLocaleProvider>
	);
}
