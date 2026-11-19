import { createFileRoute } from "@tanstack/react-router";
import { getAdminFiles } from "@/server/functions/foundation";
import { FileLibrary } from "@/components/files/library";

export const Route = createFileRoute("/{-$locale}/admin/assets")({
	loader: () => getAdminFiles(),
	component: Page,
});
function Page() {
	return <FileLibrary rows={Route.useLoaderData()} admin />;
}
