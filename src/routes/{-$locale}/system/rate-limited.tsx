import { createFileRoute } from "@tanstack/react-router";
import { normalizeLocale } from "@/i18n/messages";
import { pageHead, PublicPage } from "@/components/public/public-page";

export const Route = createFileRoute("/{-$locale}/system/rate-limited")({
	head: ({ params }) => pageHead("rate", normalizeLocale(params.locale)),
	component: Page,
});
function Page() {
	return (
		<PublicPage
			page="rate"
			locale={normalizeLocale(Route.useParams().locale)}
		/>
	);
}
