import { workspaceLinks } from "@/extensions";
import { useRouter, useRouterState } from "@tanstack/react-router";
import { Gauge, PanelLeft, X } from "lucide-react";
import { type ReactNode, useId } from "react";
import {
	AnimatedSidebar,
	AnimatedSidebarClose,
	AnimatedSidebarContent,
	AnimatedSidebarGroup,
	AnimatedSidebarGroupContent,
	AnimatedSidebarGroupLabel,
	AnimatedSidebarHeader,
	AnimatedSidebarMenu,
	AnimatedSidebarMenuButton,
	AnimatedSidebarMenuItem,
	AnimatedSidebarProvider,
	AnimatedSidebarTrigger,
} from "@/components/motion/animated-sidebar";
import { ButtonLink } from "@/components/motion/button";
import { BeuiLocaleProvider } from "@/components/motion/locale";
import { adminWorkspaceMessages } from "@/i18n/admin-workspace";
import {
	getDictionary,
	type Locale,
	localeToHtmlLang,
	localizedPath,
} from "@/i18n/messages";

import { useAuth } from "../auth/auth-state";
import { AccountMenu } from "./account-menu";
import {
	activeShellItem,
	adminNavItems,
	allowedShellItems,
	appNavItems,
} from "./app-shell-navigation";

export function AppShell({
	currentPage,
	children,
	mode = "app",
	locale = "en",
	actions,
	navigation,
}: {
	activeNav: string;
	currentPage: string;
	children: ReactNode;
	mode?: "app" | "admin";
	locale?: Locale;
	actions?: ReactNode;
	navigation?: ReactNode;
}) {
	const { t } = getDictionary(locale);
	const contentId = useId();
	const auth = useAuth();

	const router = useRouter();
	const currentPath = useRouterState({
		select: (state) => state.location.href,
	});
	const items =
		mode === "admin"
			? allowedShellItems(
					adminNavItems,
					auth.snapshot.status === "authenticated" &&
						auth.snapshot.canAccessAdmin
						? auth.snapshot.permissions
						: [],
				)
			: appNavItems.filter(
					(item) => item.to !== "/admin" || auth.canAccessAdmin,
				);
	const activeItem = activeShellItem(items, currentPath, locale);
	const root = localizedPath(mode === "admin" ? "/admin" : "/app", locale);
	const rootLabel = t(mode === "admin" ? "shell.adminRoot" : "shell.appRoot");
	const grouped = new Map<
		NonNullable<(typeof items)[number]["groupKey"]>,
		typeof items
	>();
	for (const item of items) {
		const group = item.groupKey ?? "shell.nav.main";
		grouped.set(group, [...(grouped.get(group) ?? []), item]);
	}
	return (
		<BeuiLocaleProvider locale={locale}>
			<AnimatedSidebarProvider
				data-beui="app-shell"
				lang={localeToHtmlLang(locale)}
				className="bg-background text-foreground"
			>
				<a
					href={`#${contentId}`}
					className="sr-only z-50 rounded-lg bg-primary px-4 py-3 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus-visible:outline-2 focus-visible:outline-ring"
				>
					{adminWorkspaceMessages[locale].skipToContent}
				</a>
				<AnimatedSidebar
					ariaLabel={t("shell.navigation")}
					collapsible="offcanvas"
				>
					<AnimatedSidebarHeader>
						<div className="flex min-w-0 items-center justify-between gap-2">
							<ButtonLink
								href={root}
								variant="ghost"
								className="min-w-0 justify-start"
							>
								<Gauge size={20} strokeWidth={2} aria-hidden />
								<span className="truncate">
									{t(
										mode === "admin" ? "shell.adminConsole" : "shell.workspace",
									)}
								</span>
							</ButtonLink>
							<AnimatedSidebarClose className="md:hidden">
								<X size={20} strokeWidth={2} aria-hidden />
							</AnimatedSidebarClose>
						</div>
					</AnimatedSidebarHeader>
					<AnimatedSidebarContent>
						<nav aria-label={t("shell.navigation")}>
							{[...grouped].map(([group, entries]) => (
								<AnimatedSidebarGroup key={group}>
									{mode === "admin" && (
										<AnimatedSidebarGroupLabel>
											{t(group)}
										</AnimatedSidebarGroupLabel>
									)}
									<AnimatedSidebarGroupContent>
										<AnimatedSidebarMenu>
											{entries.map((item) => {
												const Icon = item.icon;
												return (
													<AnimatedSidebarMenuItem key={item.to}>
														<AnimatedSidebarMenuButton
															icon={<Icon size={20} strokeWidth={2} />}
															href={localizedPath(item.to, locale)}
															onNavigate={(href) => {
																void router.navigate({ href });
															}}
															isActive={activeItem?.to === item.to}
														>
															{t(item.labelKey)}
														</AnimatedSidebarMenuButton>
													</AnimatedSidebarMenuItem>
												);
											})}
										</AnimatedSidebarMenu>
									</AnimatedSidebarGroupContent>
								</AnimatedSidebarGroup>
							))}
							{!items.length && (
								<p role="status" className="px-3 text-sm text-muted-foreground">
									{t("shell.noNavigation")}
								</p>
							)}
							{mode === "app" &&
								workspaceLinks
									.filter(
										(link) =>
											!link.permission ||
											(auth.snapshot.status === "authenticated" &&
												auth.snapshot.permissions.includes(link.permission)),
									)
									.map((link) => (
										<a
											className="block rounded-md px-3 py-2 text-sm"
											key={link.path}
											href={localizedPath(link.path, locale)}
										>
											{link.label}
										</a>
									))}
						</nav>
					</AnimatedSidebarContent>
				</AnimatedSidebar>
				<div className="flex min-w-0 flex-1 flex-col">
					<header className="sticky top-0 z-20 flex min-h-16 items-center gap-3 border-b border-border bg-background px-4 sm:px-6">
						<AnimatedSidebarTrigger>
							<PanelLeft size={20} strokeWidth={2} aria-hidden />
						</AnimatedSidebarTrigger>
						<nav aria-label={t("shell.breadcrumb")} className="min-w-0 flex-1">
							<ol className="m-0 flex min-w-0 list-none flex-wrap items-center gap-x-2 gap-y-1 p-0 text-sm">
								<li>
									<ButtonLink size="sm" variant="ghost" href={root}>
										{rootLabel}
									</ButtonLink>
								</li>
								<li aria-hidden className="text-muted-foreground">
									/
								</li>
								<li
									aria-current="page"
									className="min-w-0 break-words font-medium"
								>
									{mode === "admin" ? (
										currentPage
									) : (
										<h1 className="m-0 text-sm font-medium">{currentPage}</h1>
									)}
								</li>
							</ol>
						</nav>
						<AccountMenu currentPath={currentPath} locale={locale} />
					</header>
					<main
						id={contentId}
						tabIndex={-1}
						className={
							mode === "admin"
								? "mx-auto grid w-full max-w-[1600px] min-w-0 gap-7 px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
								: "w-full min-w-0 px-4 py-5 sm:px-6 lg:px-8"
						}
					>
						{mode === "admin" ? (
							<div className="grid min-w-0 gap-4">
								<div className="flex flex-wrap items-center justify-between gap-3">
									<h1 className="m-0 min-w-0 text-2xl font-semibold leading-8 tracking-tight">
										{currentPage}
									</h1>
									{actions ? (
										<div className="flex flex-wrap items-center gap-2">
											{actions}
										</div>
									) : null}
								</div>
								{navigation}
							</div>
						) : null}
						{children}
					</main>
				</div>
			</AnimatedSidebarProvider>
		</BeuiLocaleProvider>
	);
}
