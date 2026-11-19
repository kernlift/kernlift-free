import type { ReactNode } from "react";
import { AppShell } from "./app-shell";
import { getDictionary, type Locale } from "@/i18n/messages";
export type AppConsoleActive = "tickets" | "assets" | "profile" | "dashboard";
export function AppConsoleLayout({
	active,
	locale,
	children,
}: {
	active: AppConsoleActive;
	locale: Locale;
	children: ReactNode;
	user?: unknown;
}) {
	return (
		<AppShell
			activeNav={active}
			locale={locale}
			currentPage={getDictionary(locale).t(`appConsole.${active}`)}
		>
			{children}
		</AppShell>
	);
}
export function AppConsoleProfileLayout(props: {
	locale: Locale;
	children: ReactNode;
	user?: unknown;
}) {
	return <AppConsoleLayout active="profile" {...props} />;
}
