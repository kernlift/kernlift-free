import { createFileRoute } from "@tanstack/react-router";
import { normalizeLocale } from "@/i18n/messages";
import { pageHead, PublicPage } from "@/components/public/public-page";

export const Route = createFileRoute("/{-$locale}/privacy")({
	head: ({ params }) => pageHead("privacy", normalizeLocale(params.locale)),
	component: Page,
});
function Page() {
	return (
		<PublicPage
			page="privacy"
			locale={normalizeLocale(Route.useParams().locale)}
		/>
	);
}
