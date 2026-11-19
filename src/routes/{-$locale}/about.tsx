import { createFileRoute } from "@tanstack/react-router";
import { normalizeLocale } from "@/i18n/messages";
import { pageHead, PublicPage } from "@/components/public/public-page";

export const Route = createFileRoute("/{-$locale}/about")({
	head: ({ params }) => pageHead("about", normalizeLocale(params.locale)),
	component: Page,
});
function Page() {
	return (
		<PublicPage
			page="about"
			locale={normalizeLocale(Route.useParams().locale)}
		/>
	);
}
