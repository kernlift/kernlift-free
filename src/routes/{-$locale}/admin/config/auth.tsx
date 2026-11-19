import { createFileRoute } from "@tanstack/react-router";
import { getSettings } from "@/server/functions/foundation";
import { Providers } from "@/components/settings/provider-settings";

export const Route = createFileRoute("/{-$locale}/admin/config/auth")({
	loader: () => getSettings(),
	component: Page,
});
function Page() {
	return <Providers data={Route.useLoaderData()} group="auth" />;
}
