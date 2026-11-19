import { Download } from "lucide-react";
import { useMemo, useState } from "react";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { ConfigSelect } from "@/components/admin/config-layout";
import { CodeBlock } from "./audit-code";
import { BouncyAccordion } from "@/components/motion/bouncy-accordion";
import { Button, ButtonLink } from "@/components/motion/button";
import { Input } from "@/components/motion/input";
import { getMessageNamespace, type Locale } from "@/i18n/messages";
import type { SecurityAuditSnapshot } from "@/server/db/repositories/security-audit.repository";
import type { PermissionRow } from "@/server/db/repositories/users-rbac.repository";

function DirectoryFilter({
	label,
	allLabel,
	options,
	value,
	onChange,
	className,
}: {
	label: string;
	allLabel: string;
	options: string[];
	value: string;
	onChange(value: string): void;
	className?: string;
}) {
	return (
		<ConfigSelect
			className={className}
			label={label}
			value={value}
			onValueChange={onChange}
			options={[
				{ value: "", label: allLabel },
				...options.map((option) => ({ value: option, label: option })),
			]}
		/>
	);
}

export function PermissionsDirectory({
	permissions,
	locale,
}: {
	permissions: PermissionRow[];
	locale: Locale;
}) {
	const copy = getMessageNamespace(locale, "permissionsCopy");
	const [query, setQuery] = useState("");
	const [module, setModule] = useState("");
	const [expanded, setExpanded] = useState<string | null>(null);
	const modules = [
		...new Set(permissions.map((permission) => permission.module)),
	].sort();
	const effectiveModule = modules.includes(module) ? module : "";
	const filtered = permissions.filter(
		(permission) =>
			(!effectiveModule || permission.module === effectiveModule) &&
			`${permission.name} ${permission.key} ${permission.description} ${permission.module}`
				.toLocaleLowerCase(locale)
				.includes(query.trim().toLocaleLowerCase(locale)),
	);
	const groups = modules
		.map((name) => ({
			name,
			permissions: filtered.filter((permission) => permission.module === name),
		}))
		.filter((group) => group.permissions.length);
	return (
		<div className="@container grid w-full min-w-0 grid-cols-1 gap-4">
			<AdminFilterBar>
				<Input
					label={copy.searchLabel}
					placeholder={copy.searchPlaceholder}
					value={query}
					onChange={setQuery}
					type="search"
				/>
				<DirectoryFilter
					label={copy.module}
					allLabel={copy.allModules}
					options={modules}
					value={effectiveModule}
					onChange={setModule}
				/>
			</AdminFilterBar>
			<p role="status" className="m-0 text-sm text-muted-foreground">
				{copy.resultCount(filtered.length, permissions.length)}
			</p>
			{groups.length ? (
				<BouncyAccordion
					className="min-w-0"
					value={expanded}
					onValueChange={setExpanded}
					classNames={{
						title: "min-w-0 whitespace-normal text-sm [overflow-wrap:anywhere]",
						description: "text-sm",
						trigger: "py-3",
					}}
					items={groups.map((group) => ({
						id: group.name,
						title: copy.moduleCount(group.name, group.permissions.length),
						description: (
							<ul className="m-0 grid min-w-0 list-none gap-5 p-0 @min-[48rem]:grid-cols-2">
								{group.permissions.map((permission) => (
									<li
										key={permission.id}
										className="grid min-w-0 content-start gap-1 break-words"
									>
										<span className="font-medium text-foreground">
											{permission.name}
										</span>
										<span className="text-xs">{permission.key}</span>
										<span>
											{locale === "zh" ? "授权角色" : "Granted to"} ·{" "}
											{permission.roles.join(", ") || "—"}
										</span>
										{permission.description && (
											<p className="m-0">{permission.description}</p>
										)}
									</li>
								))}
							</ul>
						),
					}))}
				/>
			) : (
				<div className="grid justify-items-start gap-3 py-5 text-sm text-muted-foreground">
					<p className="m-0">
						{permissions.length ? copy.noMatches : copy.empty}
					</p>
					{(query || effectiveModule) && (
						<Button
							variant="outline"
							onClick={() => {
								setQuery("");
								setModule("");
							}}
						>
							{copy.clearFilters}
						</Button>
					)}
				</div>
			)}
		</div>
	);
}

export function AuditDirectory({
	snapshot,
	locale,
}: {
	snapshot: Pick<SecurityAuditSnapshot, "auditLogs" | "auditExport">;
	locale: Locale;
}) {
	const copy = getMessageNamespace(locale, "auditCopy");
	const [query, setQuery] = useState("");
	const [action, setAction] = useState("");
	const [expanded, setExpanded] = useState<string | null>(null);
	const [visited, setVisited] = useState<Set<string>>(() => new Set());
	const actions = [
		...new Set(snapshot.auditLogs.map((event) => event.action)),
	].sort();
	const effectiveAction = actions.includes(action) ? action : "";
	const events = snapshot.auditLogs.filter(
		(event) =>
			(!effectiveAction || event.action === effectiveAction) &&
			`${event.action} ${event.actor} ${event.target} ${event.metadata}`
				.toLocaleLowerCase(locale)
				.includes(query.trim().toLocaleLowerCase(locale)),
	);
	const csvHref = useMemo(
		() =>
			`data:text/csv;charset=utf-8,${encodeURIComponent(snapshot.auditExport.csv)}`,
		[snapshot.auditExport.csv],
	);
	return (
		<div className="@container grid w-full min-w-0 grid-cols-1 gap-4">
			<AdminFilterBar>
				<Input
					label={copy.search}
					placeholder={copy.searchPlaceholder}
					value={query}
					onChange={setQuery}
					type="search"
				/>
				<DirectoryFilter
					className="!flex-[1_1_10rem]"
					label={copy.event}
					allLabel={copy.allEvents}
					options={actions}
					value={effectiveAction}
					onChange={setAction}
				/>
				<ButtonLink
					className="!flex-[0_0_auto]"
					variant="outline"
					download={`audit-logs-${snapshot.auditExport.generatedAt.slice(0, 10)}.csv`}
					href={csvHref}
				>
					<Download className="size-4" />
					{copy.exportLabel}
				</ButtonLink>
			</AdminFilterBar>
			<p role="status" className="m-0 text-sm text-muted-foreground">
				{copy.filteredSummary(
					events.length,
					snapshot.auditLogs.length,
					snapshot.auditExport.rowCount,
				)}
			</p>
			{events.length ? (
				<BouncyAccordion
					className="min-w-0"
					value={expanded}
					onValueChange={(id) => {
						setExpanded(id);
						if (id) setVisited((current) => new Set(current).add(id));
					}}
					classNames={{
						title: "min-w-0 whitespace-normal text-sm [overflow-wrap:anywhere]",
						description: "text-sm",
						trigger: "py-3",
					}}
					items={events.map((event) => ({
						id: event.id,
						title: (
							<span className="grid min-w-0 gap-1">
								<span>{event.action}</span>
								<span className="text-xs font-normal text-muted-foreground">
									{event.actor} · {event.target}
								</span>
								<span className="text-xs font-normal text-muted-foreground">
									{auditDate(event.createdAt, locale)}
								</span>
							</span>
						),
						description: (
							<div className="grid min-w-0 grid-cols-1 gap-4">
								<dl className="m-0 grid min-w-0 gap-3 sm:grid-cols-2">
									{[
										[copy.actor, event.actor],
										[copy.target, event.target],
										[copy.created, event.createdAt],
										[copy.identifier, event.id],
									].map(([label, value]) => (
										<div
											key={label}
											className="min-w-0 [overflow-wrap:anywhere]"
										>
											<dt className="text-xs">{label}</dt>
											<dd className="m-0 text-foreground">{value}</dd>
										</div>
									))}
								</dl>
								{visited.has(event.id) && (
									<CodeBlock
										code={event.metadata}
										language={isJson(event.metadata) ? "json" : "text"}
										filename={copy.metadata}
										labels={copy.codeLabels}
										showStatus={false}
										wrap
										showLineNumbers={false}
										maxHeight={320}
									/>
								)}
							</div>
						),
					}))}
				/>
			) : (
				<div className="grid justify-items-start gap-3 py-5 text-sm text-muted-foreground">
					<p className="m-0">
						{snapshot.auditLogs.length ? copy.noMatches : copy.empty}
					</p>
					{(query || effectiveAction) && (
						<Button
							variant="outline"
							onClick={() => {
								setQuery("");
								setAction("");
							}}
						>
							{copy.clearFilters}
						</Button>
					)}
				</div>
			)}
		</div>
	);
}

function isJson(value: string) {
	try {
		JSON.parse(value);
		return true;
	} catch {
		return false;
	}
}
function auditDate(value: string, locale: Locale) {
	const date = new Date(value);
	return Number.isFinite(date.getTime())
		? new Intl.DateTimeFormat(locale, {
				dateStyle: "medium",
				timeStyle: "long",
				timeZone: "UTC",
			}).format(date)
		: value;
}
