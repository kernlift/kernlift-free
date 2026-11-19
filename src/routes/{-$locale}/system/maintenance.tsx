import { createFileRoute } from "@tanstack/react-router";
import { normalizeLocale } from "@/i18n/messages";
import { pageHead, PublicPage } from "@/components/public/public-page";

export const Route = createFileRoute("/{-$locale}/system/maintenance")({
	head: ({ params }) => pageHead("maintenance", normalizeLocale(params.locale)),
	component: Page,
});
function Page() {
	return (
		<PublicPage
			page="maintenance"
			locale={normalizeLocale(Route.useParams().locale)}
		/>
	);
}
