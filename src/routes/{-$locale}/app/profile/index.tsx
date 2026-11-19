import { createFileRoute } from "@tanstack/react-router";
import { FormDivider } from "@/beui/form-layout";
import { useAuth } from "../../../../components/auth/auth-state";
import { Preferences } from "@/components/profile/preferences";
import {
	AppRouteError,
	AppRouteLoading,
	useProgressiveRouteData,
} from "../../../../components/layout/app-route-states";
import { ProfileDeleteAccount } from "../../../../components/profile/profile-delete-account";
import { ProfilePersonalInfoPanel } from "../../../../components/profile/profile-personal-info-panel";
import { ProfileShell } from "../../../../components/profile/profile-shell";
import { type Locale, normalizeLocale } from "../../../../i18n/messages";
import { useI18n } from "../../../../i18n/use-i18n";
import { getPreferences } from "@/server/functions/foundation";

async function loadProfile() {
	return { notifications: await getPreferences() };
}

export const Route = createFileRoute("/{-$locale}/app/profile/")({
	component: Profile,
});

type ProfileSnapshot = Awaited<ReturnType<typeof loadProfile>>;

function Profile() {
	const { locale } = Route.useParams();
	const normalizedLocale = normalizeLocale(locale);
	const { retry, state } = useProgressiveRouteData("app:profile", loadProfile);
	if (state.status === "loading") {
		return <AppRouteLoading active="profile" locale={normalizedLocale} />;
	}
	if (state.status === "error") {
		return (
			<AppRouteError active="profile" locale={normalizedLocale} retry={retry} />
		);
	}
	return <ProfileView locale={normalizedLocale} snapshot={state.snapshot} />;
}

export function ProfileView({
	locale = "en",
	snapshot,
}: {
	locale?: Locale;
	snapshot: ProfileSnapshot;
}) {
	const { t } = useI18n();
	const { user } = useAuth();
	return (
		<ProfileShell
			description={t("app.profile.personalDescription")}
			locale={locale}
			title={t("app.profile.personalTitle")}
			user={user}
		>
			{user ? (
				<>
					<ProfilePersonalInfoPanel key={user.id} locale={locale} user={user} />
					<FormDivider />
					<section
						aria-labelledby="profile-notifications-title"
						className="grid gap-5 scroll-mt-24"
						id="profile-notifications"
					>
						<div className="grid gap-2">
							<h2
								className="text-lg font-semibold"
								id="profile-notifications-title"
							>
								{t("app.profile.notificationsTitle")}
							</h2>
							<p className="text-sm leading-6 text-muted-foreground">
								{t("app.profile.notificationsDescription")}
							</p>
						</div>
						<Preferences {...snapshot.notifications} />
					</section>
					<FormDivider />
					<ProfileDeleteAccount key={`delete-${user.id}`} locale={locale} />
				</>
			) : null}
		</ProfileShell>
	);
}
