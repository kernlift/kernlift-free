import { createFileRoute } from "@tanstack/react-router";
import { BrandHeader } from "@/components/brand-header";
import { ButtonLink } from "@/components/motion/button";
import { Surface, SurfaceContent } from "@/components/motion/surface";
import { AuthForm } from "../../../components/auth/auth-form";
import {
	getDictionary,
	type Locale,
	localizedPath,
	normalizeLocale,
} from "../../../i18n/messages";

export const Route = createFileRoute("/{-$locale}/auth/reset-password")({
	component: ResetPassword,
});

function ResetPassword() {
	const { locale } = Route.useParams();
	return <ResetPasswordView locale={normalizeLocale(locale)} />;
}

export function ResetPasswordView({ locale = "en" }: { locale?: Locale }) {
	const { t } = getDictionary(locale);

	return (
		<div className="min-h-dvh bg-background text-foreground">
			<BrandHeader locale={locale} />
			<main className="grid min-h-[calc(100dvh-6rem)] place-items-center px-5 py-12">
				<Surface className="w-full max-w-md">
					<SurfaceContent className="grid gap-5 p-6 sm:p-8">
						<AuthForm
							locale={locale}
							mode="reset-password"
							submitLabel={t("auth.resetPassword.submit")}
							title={t("auth.resetPassword.title")}
						/>
						<ButtonLink
							className="w-full"
							href={localizedPath("/auth/sign-in", locale)}
							variant="ghost"
						>
							{t("auth.resetPassword.backToSignIn")}
						</ButtonLink>
					</SurfaceContent>
				</Surface>
			</main>
		</div>
	);
}
