import { createFileRoute } from "@tanstack/react-router";
import { getFiles } from "@/server/functions/foundation";
import { FileLibrary } from "@/components/files/library";

export const Route = createFileRoute("/{-$locale}/app/assets/")({
	loader: () => getFiles(),
	component: Page,
});
function Page() {
	return <FileLibrary rows={Route.useLoaderData()} />;
}
