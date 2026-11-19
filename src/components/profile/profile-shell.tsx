"use client";

import type { ReactNode } from "react";
import { type Locale, localeToHtmlLang } from "../../i18n/messages";
import { AppConsoleProfileLayout } from "../layout/app-console-sidebar";

type ProfileLocale = Locale;
type ProfileUser = {
	name?: string | null;
	email?: string | null;
};

export function ProfileShell({
	aside,
	children,
	description,
	locale = "en",
	title,
	user,
}: {
	aside?: ReactNode;
	children: ReactNode;
	description: string;
	locale?: ProfileLocale;
	title: string;
	user?: ProfileUser | null;
}) {
	return (
		<AppConsoleProfileLayout locale={locale} user={user}>
			<section
				className="mx-auto grid w-full min-w-0 max-w-3xl gap-8"
				data-beui="profile-settings"
				data-screen-id="6b1ef36f7afa4d078c8755cdab97d550"
				lang={localeToHtmlLang(locale)}
			>
				<header className="grid gap-2">
					<h2 className="text-2xl font-semibold text-foreground">{title}</h2>
					<p className="text-sm leading-6 text-muted-foreground">
						{description}
					</p>
				</header>

				<div
					className={`grid gap-4 ${aside ? "xl:grid-cols-[minmax(0,1fr)_360px]" : ""}`}
				>
					<div className="grid min-w-0 gap-8">{children}</div>
					{aside ? (
						<aside className="grid content-start gap-4">{aside}</aside>
					) : null}
				</div>
			</section>
		</AppConsoleProfileLayout>
	);
}
