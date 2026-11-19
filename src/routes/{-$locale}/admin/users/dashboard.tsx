import { createFileRoute } from "@tanstack/react-router";
import { getUsers } from "@/server/functions/foundation";
import { UserList } from "@/components/admin/registration-pages";

export const Route = createFileRoute("/{-$locale}/admin/users/dashboard")({
	loader: () => getUsers(),
	component: Page,
});
function Page() {
	return <UserList rows={Route.useLoaderData()} />;
}
