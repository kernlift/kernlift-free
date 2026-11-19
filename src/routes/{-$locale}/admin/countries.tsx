import { createFileRoute } from "@tanstack/react-router";
import { getRegistrations } from "@/server/functions/user-dashboard";
import { RegistrationPage } from "@/components/admin/registration-pages";

export const Route = createFileRoute("/{-$locale}/admin/countries")({
	validateSearch: (s): { days?: 7 | 30 | 90 } => {
		const days = Number(s.days);
		return days === 7 || days === 30 || days === 90 ? { days } : {};
	},
	loaderDeps: ({ search }) => ({ days: search.days ?? (30 as const) }),
	loader: ({ deps }) => getRegistrations({ data: deps }),
	component: Page,
});
function Page() {
	return (
		<RegistrationPage
			report={Route.useLoaderData()}
			days={Route.useSearch().days ?? 30}
			countries
			all={Route.useSearch().days === undefined}
		/>
	);
}
