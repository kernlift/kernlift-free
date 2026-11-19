import { createFileRoute } from "@tanstack/react-router";
import { getFile } from "@/server/functions/foundation";
import { FileDetail } from "@/components/files/library";

export const Route = createFileRoute("/{-$locale}/app/assets/$assetId")({
	loader: ({ params }) => getFile({ data: params.assetId }),
	component: Page,
});
function Page() {
	return <FileDetail file={Route.useLoaderData()} />;
}
