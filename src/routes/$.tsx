import { createFileRoute, redirect } from "@tanstack/react-router";
import { Site } from "../components/site";
import { getAccess } from "../access";
export const Route = createFileRoute("/$")({
	beforeLoad: async ({ params }) => {
		const [area] = String(params._splat || "").split("/");
		if (area !== "app" && area !== "admin") return;
		const actor = await getAccess();
		if (!actor) throw redirect({ href: "/auth/sign-in" });
		if (area === "admin" && !actor.permissions.length)
			throw redirect({ href: "/system/permission-denied" });
	},
	component: Page,
});
function Page() {
	const { _splat } = Route.useParams();
	return <Site path={_splat} />;
}
