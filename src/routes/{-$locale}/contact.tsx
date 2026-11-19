import { createFileRoute } from "@tanstack/react-router";
import { normalizeLocale } from "@/i18n/messages";
import { pageHead, PublicPage } from "@/components/public/public-page";

export const Route = createFileRoute("/{-$locale}/contact")({
	head: ({ params }) => pageHead("contact", normalizeLocale(params.locale)),
	component: Page,
});
function Page() {
	return (
		<PublicPage
			page="contact"
			locale={normalizeLocale(Route.useParams().locale)}
		/>
	);
}
