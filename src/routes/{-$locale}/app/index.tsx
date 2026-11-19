import { createFileRoute } from "@tanstack/react-router";
import { getHome } from "@/server/functions/foundation";
import { Home } from "@/components/workspace/home";

export const Route = createFileRoute("/{-$locale}/app/")({
	loader: () => getHome(),
	component: Page,
});
function Page() {
	return <Home data={Route.useLoaderData()} />;
}
