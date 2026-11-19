import { createFileRoute } from "@tanstack/react-router";
import { MailCheck, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { BrandHeader } from "@/components/brand-header";
import { ButtonLink } from "@/components/motion/button";
import { Surface, SurfaceContent } from "@/components/motion/surface";
import { siteConfig } from "@/config/site";
import {
	getDictionary,
	localizedPath,
	normalizeLocale,
} from "../../../i18n/messages";
import { cn } from "../../../lib/utils";
import { verifyEmailToken } from "../../../server/functions/auth";

export const Route = createFileRoute("/{-$locale}/auth/verify-email")({
	component: VerifyEmail,
});

type VerificationState = "checking" | "verified" | "invalid" | "expired";

function VerifyEmail() {
	const { locale } = Route.useParams();
	const normalizedLocale = normalizeLocale(locale);
	const { t } = getDictionary(normalizedLocale);
	const [state, setState] = useState<VerificationState>("checking");

	useEffect(() => {
		const token = new URLSearchParams(window.location.search).get("token");
		if (!token) {
			setState("invalid");
			return;
		}

		let alive = true;
		verifyEmailToken({ data: { token } })
			.then((result) => {
				if (!alive) return;
				setState(result.status === "verified" ? "verified" : result.status);
			})
			.catch(() => {
				if (alive) setState("invalid");
			});

		return () => {
			alive = false;
		};
	}, []);

	const title = {
		checking: t("auth.verifyEmail.checking"),
		verified: t("auth.verifyEmail.verified"),
		invalid: t("auth.verifyEmail.invalid"),
		expired: t("auth.verifyEmail.expired"),
	}[state];

	const description = {
		checking: t("auth.verifyEmail.checkingDescription"),
		verified: t("auth.verifyEmail.verifiedDescription"),
		invalid: t("auth.verifyEmail.invalidDescription"),
		expired: t("auth.verifyEmail.expiredDescription"),
	}[state];

	return (
		<div className="min-h-dvh bg-background text-foreground">
			<BrandHeader locale={normalizedLocale} />
			<main className="grid min-h-[calc(100dvh-6rem)] place-items-center px-5 py-12">
				<Surface className="mx-auto w-full max-w-md border-foreground/10 bg-card shadow-xl shadow-black/5">
					<SurfaceContent className="grid gap-5 p-6 text-center">
						<div
							className={cn(
								"mx-auto grid size-12 place-items-center rounded-2xl ring-1",
								state === "checking" &&
									"bg-muted text-muted-foreground ring-border",
								state === "verified" &&
									"bg-[var(--growth-wash)] text-[var(--color-success)] ring-[var(--color-success)]/20",
								(state === "invalid" || state === "expired") &&
									"bg-[var(--failure-wash)] text-[var(--failure-red)] ring-[var(--failure-border)]",
							)}
						>
							{state === "verified" || state === "checking" ? (
								<MailCheck size={24} />
							) : (
								<TriangleAlert size={24} />
							)}
						</div>
						<div>
							<h1 className="text-2xl font-semibold text-foreground">
								{title}
							</h1>
							<p className="mt-2 text-sm text-muted-foreground">
								{description}
							</p>
						</div>
						<ButtonLink
							href={localizedPath(siteConfig.signedInHome, normalizedLocale)}
							variant="primary"
						>
							{t("auth.verifyEmail.backToProfile")}
						</ButtonLink>
					</SurfaceContent>
				</Surface>
			</main>
		</div>
	);
}
