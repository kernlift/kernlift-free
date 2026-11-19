import { createFileRoute } from "@tanstack/react-router";
import { getUser } from "@/server/functions/foundation";
import { UserDetail } from "@/components/admin/registration-pages";

export const Route = createFileRoute("/{-$locale}/admin/users/$userId")({
	loader: ({ params }) => getUser({ data: params.userId }),
	component: Page,
});
function Page() {
	return <UserDetail data={Route.useLoaderData()} />;
}
