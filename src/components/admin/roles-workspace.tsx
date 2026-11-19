import { EditorDialog } from "@/beui/editor-dialog";
import { type FormEvent, useMemo, useState } from "react";
import { AdminRecords } from "@/components/admin/admin-records";
import { AdminSaveFeedback, useAdminSave } from "@/components/admin/admin-save";
import { ConfigPanel, ConfigPanelGrid } from "@/components/admin/config-layout";
import { BouncyAccordion } from "@/components/motion/bouncy-accordion";
import { Button } from "@/components/motion/button";
import { Input } from "@/components/motion/input";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/components/motion/tabs";
import { adminRbacMessages } from "@/i18n/admin-rbac";
import { getMessageNamespace, type Locale } from "@/i18n/messages";
import type {
	AdminUserRow,
	RoleRow,
	UsersRbacSnapshot,
} from "@/server/db/repositories/users-rbac.repository";
import { deleteRbacRole } from "@/server/functions/users-rbac";
import { RoleEditorActions } from "./role-editor-actions";
import { UserRoleDialog } from "./user-role-actions";

export function RolesWorkspace({
	locale,
	snapshot,
}: {
	locale: Locale;
	snapshot: UsersRbacSnapshot;
}) {
	const copy = getMessageNamespace(locale, "rolesCopy");
	const [query, setQuery] = useState("");
	const [expanded, setExpanded] = useState<string | null>(null);
	const [deleting, setDeleting] = useState<RoleRow | null>(null);
	const access = useAdminSave("roles.write");
	const usersByRole = useMemo(
		() => groupUsersByRoleId(snapshot.roleUsers),
		[snapshot.roleUsers],
	);
	const permissionByKey = new Map(
		snapshot.permissions.map((permission) => [permission.key, permission]),
	);
	const roles = snapshot.roles.filter((role) =>
		`${role.name} ${role.key} ${role.description}`
			.toLocaleLowerCase(locale)
			.includes(query.trim().toLocaleLowerCase(locale)),
	);
	return (
		<div className="@container grid w-full min-w-0 gap-4">
			{!access.allowed && (
				<p className="m-0 text-sm">{adminRbacMessages[locale].roleReadOnly}</p>
			)}
			<Tabs defaultValue="manage">
				<TabsList aria-label={copy.currentPage}>
					<TabsTrigger value="manage">{copy.manageTab}</TabsTrigger>
					<TabsTrigger value="create" disabled={!access.allowed}>
						{copy.createTab}
					</TabsTrigger>
				</TabsList>
				<TabsContent value="manage" className="mt-6">
					<div className="grid min-w-0 gap-5">
						<Input
							classNames={{ field: "rounded-lg bg-background/50" }}
							label={copy.search}
							value={query}
							onChange={setQuery}
							placeholder={copy.searchPlaceholder}
							type="search"
						/>
						{roles.length ? (
							<BouncyAccordion
								value={expanded}
								onValueChange={setExpanded}
								classNames={{
									title: "whitespace-normal break-words text-sm leading-6",
									trigger: "py-4",
									description: "text-sm",
								}}
								items={roles.map((role) => ({
									id: role.id,
									title: (
										<span className="grid min-w-0 gap-1">
											<span>{role.name}</span>
											<span className="text-xs font-normal text-muted-foreground">
												{copy.roleSummary(
													role.permissions.length,
													(usersByRole.get(role.id) ?? []).length,
												)}
											</span>
										</span>
									),
									description: (
										<div className="grid min-w-0 gap-6">
											<div className="grid min-w-0 gap-3">
												<p className="m-0 break-words text-xs">{role.key}</p>
												{role.description && (
													<p className="m-0 break-words">{role.description}</p>
												)}
												<div className="flex flex-wrap gap-2">
													{!["admin", "member"].includes(role.key) && (
														<RoleEditorActions
															display="dialog"
															locale={locale}
															role={role}
															permissions={snapshot.permissions}
															triggerLabel={copy.edit}
														/>
													)}
													<Button
														size="sm"
														variant="danger"
														disabled={
															!access.allowed ||
															["admin", "member", "support"].includes(
																role.key,
															) ||
															Boolean(usersByRole.get(role.id)?.length)
														}
														onClick={() => setDeleting(role)}
													>
														{copy.delete}
													</Button>
												</div>
											</div>
											{Boolean(usersByRole.get(role.id)?.length) && (
												<p className="m-0 text-sm text-muted-foreground">
													{adminRbacMessages[locale].assignedRole}
												</p>
											)}
											<ConfigPanelGrid>
												<ConfigPanel title={copy.permissions}>
													{role.permissions.length ? (
														<ul className="m-0 grid min-w-0 list-none gap-3 p-0 @min-[24rem]:grid-cols-2">
															{role.permissions.map((key) => (
																<li
																	key={key}
																	className="grid min-w-0 gap-0.5 break-words"
																>
																	<span className="text-foreground">
																		{permissionByKey.get(key)?.name ?? key}
																	</span>
																	{permissionByKey.has(key) && (
																		<span className="text-xs">{key}</span>
																	)}
																</li>
															))}
														</ul>
													) : (
														<p className="m-0">{copy.noPermissions}</p>
													)}
												</ConfigPanel>
												<ConfigPanel title={copy.roleUsers}>
													<RoleMembers
														users={usersByRole.get(role.id) ?? []}
														roles={snapshot.roles}
														locale={locale}
													/>
												</ConfigPanel>
											</ConfigPanelGrid>
										</div>
									),
								}))}
							/>
						) : (
							<div
								role="status"
								className="grid justify-items-start gap-3 py-6 text-sm text-muted-foreground"
							>
								<p>{query ? copy.noMatches : copy.noRoles}</p>
								{query && (
									<Button variant="outline" onClick={() => setQuery("")}>
										{copy.clearSearch}
									</Button>
								)}
							</div>
						)}
					</div>
				</TabsContent>
				<TabsContent value="create" className="mt-6">
					<div className="max-w-3xl">
						<RoleEditorActions
							locale={locale}
							permissions={snapshot.permissions}
						/>
					</div>
				</TabsContent>
			</Tabs>
			{deleting && (
				<RoleDeleteDialog
					locale={locale}
					role={deleting}
					onClose={() => setDeleting(null)}
				/>
			)}
		</div>
	);
}

function RoleMembers({
	users,
	roles,
	locale,
}: {
	users: AdminUserRow[];
	roles: RoleRow[];
	locale: Locale;
}) {
	const copy = getMessageNamespace(locale, "rolesCopy");
	const [selected, setSelected] = useState<AdminUserRow | null>(null);
	const access = useAdminSave("users.write");
	return (
		<>
			<AdminRecords
				framed={false}
				rows={users}
				rowKey={(user) => user.id}
				title={copy.roleUsers}
				emptyLabel={copy.noUsers}
				searchText={(user) =>
					`${user.name} ${user.email} ${user.roleKeys.join(" ")}`
				}
				columns={[
					{
						key: "user",
						label: locale === "zh" ? "用户" : "User",
						render: (user) => (
							<div className="grid min-w-0 gap-1">
								<span>{user.name}</span>
								<span className="text-xs text-muted-foreground">
									{user.email}
								</span>
							</div>
						),
					},
					{
						key: "roles",
						label: copy.role,
						render: (user) => user.roles.join(", "),
					},
					{
						key: "actions",
						label: copy.actions,
						render: (user) => (
							<Button
								size="sm"
								variant="outline"
								disabled={!access.allowed}
								onClick={() => setSelected(user)}
							>
								{copy.updateRoles}
							</Button>
						),
					},
				]}
			/>
			{selected && (
				<UserRoleDialog
					key={selected.id}
					user={selected}
					roles={roles}
					locale={locale}
					onClose={() => setSelected(null)}
				/>
			)}
		</>
	);
}

function RoleDeleteDialog({
	locale,
	role,
	onClose,
}: {
	locale: Locale;
	role: RoleRow;
	onClose(): void;
}) {
	const copy = getMessageNamespace(locale, "rolesCopy");
	const save = useAdminSave("roles.write");
	const [deleted, setDeleted] = useState(false);
	async function remove(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (deleted) return;
		await save.save(async () => {
			await deleteRbacRole({ data: { roleId: role.id } });
			setDeleted(true);
		});
	}
	return (
		<EditorDialog
			open
			dismissible={!save.pending}
			onOpenChange={(next) => {
				if (!next && !save.pending) onClose();
			}}
			title={copy.deleteDialog.title}
			description={copy.deleteDialog.description}
			closeLabel={copy.close}
		>
			<form
				onSubmit={remove}
				aria-busy={save.pending}
				className="grid min-w-0 gap-4"
			>
				<div className="grid min-w-0 gap-1 break-words">
					<p className="m-0 font-medium">{role.name}</p>
					<p className="m-0 text-sm text-muted-foreground">{role.key}</p>
				</div>
				<AdminSaveFeedback
					state={save}
					locale={locale}
					failureMessage={adminRbacMessages[locale].deleteFailed}
				/>
				<div className="flex flex-wrap justify-end gap-2">
					<Button
						disabled={save.pending}
						variant="outline"
						type="button"
						onClick={onClose}
					>
						{deleted ? copy.close : copy.deleteDialog.cancel}
					</Button>
					{!deleted && (
						<Button
							disabled={!save.allowed || save.pending || save.refreshFailed}
							variant="danger"
							type="submit"
						>
							{save.pending
								? copy.deleteDialog.deleting
								: copy.deleteDialog.confirm}
						</Button>
					)}
				</div>
			</form>
		</EditorDialog>
	);
}

function groupUsersByRoleId(users: AdminUserRow[]) {
	const groups = new Map<string, AdminUserRow[]>();
	for (const user of users)
		for (const roleId of user.roleIds)
			groups.set(roleId, [...(groups.get(roleId) ?? []), user]);
	return groups;
}
