import type { ReactNode } from "react";
import { BrandHeader } from "@/components/brand-header";
import { BouncyAccordion } from "@/components/motion/bouncy-accordion";
import { RouterButtonLink } from "@/components/motion/button/router-link";
import { BeuiLocaleProvider } from "@/components/motion/locale";
import {
	getDictionary,
	type Locale,
	localeToHtmlLang,
	localizedPath,
} from "@/i18n/messages";
import { RecoveryContent, type RecoverySeverity } from "./recovery-content";

export type { RecoverySeverity } from "./recovery-content";

/**
 * A full-page system state: what happened and the next step up front, with the
 * stored reason, next action and required permission behind a disclosure.
 * Public: it reads no session.
 */
export function SystemStatePanel({
	code,
	title,
	description,
	reason,
	nextAction,
	severity,
	permissionKey,
	locale = "en",
	action,
}: {
	code?: string;
	title: string;
	description: string;
	reason?: string;
	nextAction?: string;
	severity: RecoverySeverity;
	permissionKey?: string | null;
	locale?: Locale;
	action?: ReactNode;
}) {
	const { t } = getDictionary(locale);
	const details = [
		[t("system.panel.systemState"), code],
		[t("system.panel.reason"), reason],
		[t("system.panel.nextAction"), nextAction],
		[t("system.panel.requiredPermission"), permissionKey],
	].filter((item) => item[1]);
	return (
		<BeuiLocaleProvider locale={locale}>
			<BrandHeader locale={locale} />
			<main
				className="min-h-[calc(100dvh-6rem)] bg-background px-4 py-8 text-foreground sm:px-6"
				lang={localeToHtmlLang(locale)}
			>
				<RecoveryContent
					title={title}
					description={description}
					severity={severity}
					action={
						action ?? (
							<RouterButtonLink to={localizedPath("/app", locale)}>
								{t("recovery.workspace")}
							</RouterButtonLink>
						)
					}
				>
					{details.length ? (
						<BouncyAccordion
							items={[
								{
									id: "details",
									title: t("recovery.details"),
									description: (
										<dl className="space-y-4 text-sm leading-6 [overflow-wrap:anywhere]">
											{details.map(([label, value]) => (
												<div key={label}>
													<dt className="font-medium text-foreground">
														{label}
													</dt>
													<dd className="m-0 text-muted-foreground">{value}</dd>
												</div>
											))}
										</dl>
									),
								},
							]}
						/>
					) : null}
				</RecoveryContent>
			</main>
		</BeuiLocaleProvider>
	);
}
