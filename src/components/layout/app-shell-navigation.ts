import {
	Home,
	Users,
	Globe,
	KeyRound,
	ShieldCheck,
	Ticket,
	Folder,
	ScrollText,
	Settings,
	Mail,
	LockKeyhole,
	HardDrive,
	ClipboardCheck,
	UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { localizedPath, type Locale, type MessageKey } from "@/i18n/messages";
type Entry = {
	to: string;
	labelKey: MessageKey;
	groupKey?: MessageKey;
	icon: LucideIcon;
	permission?: string;
};
const entry = (
	to: string,
	labelKey: MessageKey,
	icon: LucideIcon,
	permission?: string,
	groupKey?: MessageKey,
): Entry => ({ to, labelKey, icon, permission, groupKey });
export const adminNavItems = [
	entry(
		"/admin",
		"shell.nav.dashboard",
		Home,
		"users",
		"shell.nav.overviewGroup",
	),
	entry(
		"/admin/users/dashboard",
		"shell.nav.users",
		Users,
		"users",
		"shell.nav.overviewGroup",
	),
	entry(
		"/admin/countries",
		"shell.nav.countries",
		Globe,
		"users",
		"shell.nav.overviewGroup",
	),
	entry(
		"/admin/roles",
		"shell.nav.roles",
		KeyRound,
		"access",
		"shell.nav.operationsGroup",
	),
	entry(
		"/admin/permissions",
		"shell.nav.permissions",
		LockKeyhole,
		"access",
		"shell.nav.operationsGroup",
	),
	entry(
		"/admin/support",
		"shell.nav.support",
		Ticket,
		"support",
		"shell.nav.operationsGroup",
	),
	entry(
		"/admin/assets",
		"shell.nav.assets",
		Folder,
		"assets",
		"shell.nav.operationsGroup",
	),
	entry(
		"/admin/audit",
		"shell.nav.audit",
		ScrollText,
		"audit",
		"shell.nav.securityGroup",
	),
	entry(
		"/admin/config/auth",
		"shell.nav.authConfig",
		ShieldCheck,
		"config",
		"shell.nav.settingsGroup",
	),
	entry(
		"/admin/config/email",
		"shell.nav.emailConfig",
		Mail,
		"config",
		"shell.nav.settingsGroup",
	),
	entry(
		"/admin/config/storage",
		"shell.nav.storageConfig",
		HardDrive,
		"config",
		"shell.nav.settingsGroup",
	),
	entry(
		"/setup",
		"shell.nav.setup",
		Settings,
		"config",
		"shell.nav.settingsGroup",
	),
	entry(
		"/onboarding",
		"shell.nav.onboarding",
		ClipboardCheck,
		"config",
		"shell.nav.settingsGroup",
	),
];
export const appNavItems = [
	entry("/app", "shell.nav.dashboard", Home),
	entry("/app/profile", "shell.nav.profile", UserRound),
	entry("/app/tickets", "appConsole.tickets", Ticket),
	entry("/app/assets", "shell.nav.assets", Folder),
	entry("/admin", "shell.nav.admin", ShieldCheck),
];
export function allowedShellItems(
	items: Entry[],
	permissions: readonly string[],
) {
	return items.filter(
		(i) => !i.permission || permissions.includes(i.permission),
	);
}
export function activeShellItem(items: Entry[], path: string, locale: Locale) {
	const clean = path.split(/[?#]/)[0].replace(/\/$/, "");
	return items
		.filter((i) => {
			const dest = localizedPath(
				i.to.replace("/users/dashboard", "/users"),
				locale,
			);
			return clean === dest || clean.startsWith(dest + "/");
		})
		.sort((a, b) => b.to.length - a.to.length)[0];
}
