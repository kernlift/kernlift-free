import { EditorDialog } from "@/beui/editor-dialog";
import { FieldLegend, FieldSet, FormError } from "@/beui/form-layout";
import { type FormEvent, useId, useState } from "react";
import { AdminSaveFeedback, useAdminSave } from "@/components/admin/admin-save";
import { Button } from "@/components/motion/button";
import { Checkbox } from "@/components/motion/checkbox";
import { Input, Textarea } from "@/components/motion/input";
import { adminEditingMessages } from "@/i18n/admin-editing";
import { adminRbacMessages } from "@/i18n/admin-rbac";
import {
	getDictionary,
	getMessageNamespace,
	type Locale,
} from "../../i18n/messages";
import type {
	PermissionRow,
	RoleRow,
} from "../../server/db/repositories/users-rbac.repository";
import { saveRbacRole } from "../../server/functions/users-rbac";

type RoleEditorActionsProps = {
	display?: "dialog" | "inline";
	role?: RoleRow;
	permissions: PermissionRow[];
	locale?: Locale;
	triggerLabel?: string;
};

export function RoleEditorActions({
	display = "inline",
	locale = "en",
	permissions,
	role,
	triggerLabel,
}: RoleEditorActionsProps) {
	const { t } = getDictionary(locale);
	const title = role
		? t("adminActions.roleEditor.editTitle")
		: t("adminActions.roleEditor.createTitle");
	const [open, setOpen] = useState(false);
	const save = useAdminSave("roles.write");

	if (display === "dialog") {
		return (
			<>
				<Button
					onClick={(event) => {
						// Mouse activation does not focus buttons in every browser. Give the
						// dialog a stable return target before its focus trap takes over.
						event.currentTarget.focus();
						save.resetFeedback();
						setOpen(true);
					}}
					disabled={!save.allowed}
					size="sm"
					type="button"
					variant="outline"
				>
					{triggerLabel ?? title}
				</Button>
				<EditorDialog
					open={open}
					onOpenChange={(next) => {
						if (!save.pending) setOpen(next);
					}}
					dismissible={!save.pending}
					title={title}
					description={role?.name ?? ""}
					closeLabel={t("rolesCopy.close")}
				>
					<RoleEditorForm
						locale={locale}
						save={save}
						permissions={permissions}
						role={role}
					/>
				</EditorDialog>
			</>
		);
	}

	return (
		<RoleEditorForm
			locale={locale}
			permissions={permissions}
			role={role}
			save={save}
		/>
	);
}

function RoleEditorForm({
	locale,
	save,
	permissions,
	role,
}: {
	locale: Locale;
	save: ReturnType<typeof useAdminSave>;
	permissions: PermissionRow[];
	role?: RoleRow;
}) {
	const { t } = getDictionary(locale);
	const roleCopy = getMessageNamespace(locale, "adminActions").roleEditor;
	const [message, setMessage] = useState("");
	const locked = !save.allowed || save.pending || save.refreshFailed;
	const [roleKey, setRoleKey] = useState(role?.key ?? "");
	const [roleName, setRoleName] = useState(role?.name ?? "");
	const [roleDescription, setRoleDescription] = useState(
		role?.description ?? "",
	);
	const [selectedPermissions, setSelectedPermissions] = useState(
		() => new Set(role?.permissions ?? []),
	);
	const [permissionQuery, setPermissionQuery] = useState("");
	const needle = permissionQuery.trim().toLocaleLowerCase(locale);
	const modules = groupPermissionsBySidebar(permissions)
		.map((group) => ({
			...group,
			permissions: group.permissions.filter((permission) =>
				`${permission.name} ${permission.key}`
					.toLocaleLowerCase(locale)
					.includes(needle),
			),
		}))
		.filter((group) => group.permissions.length > 0);
	const formId = useId();
	const keyId = `${formId}-role-key`;
	const nameId = `${formId}-role-name`;
	const descriptionId = `${formId}-role-description`;

	function applyPreset(preset: RolePreset) {
		setRoleKey(preset.key);
		setRoleName(roleCopy.presetNames[preset.labelKey]);
		setRoleDescription(roleCopy.presetDescriptions[preset.labelKey]);
		setSelectedPermissions(new Set(preset.permissions));
	}

	function togglePermission(permissionKey: string, checked: boolean) {
		setSelectedPermissions((current) => {
			const next = new Set(current);
			if (checked) next.add(permissionKey);
			else next.delete(permissionKey);
			return next;
		});
	}

	async function onSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (locked || !event.currentTarget.reportValidity()) return;
		setMessage("");

		const form = new FormData(event.currentTarget);
		// Filtering the visible choices must not drop previously selected permissions.
		const permissionKeys = permissions
			.filter((permission) => selectedPermissions.has(permission.key))
			.map((permission) => permission.key);

		if (!permissionKeys.length) {
			setMessage(adminRbacMessages[locale].permissionRequired);
			return;
		}
		await save.save(async () => {
			const result = await saveRbacRole({
				data: {
					description: String(form.get("description") ?? "").trim(),
					key: String(form.get("key") ?? "").trim(),
					name: String(form.get("name") ?? "").trim(),
					permissionKeys,
					roleId: role?.id,
				},
			}).catch((error: unknown) => {
				if (error instanceof Error && error.message.includes("ROLE_KEY_EXISTS"))
					setMessage(adminRbacMessages[locale].keyExists);
				if (
					error instanceof Error &&
					/ROLE_NOT_FOUND|Role not found/.test(error.message)
				)
					setMessage(adminRbacMessages[locale].missingRole);
				throw error;
			});
			if (role) {
				setRoleKey(result.role.key);
				setRoleName(roleName.trim());
				setRoleDescription(roleDescription.trim());
			}
			if (!role) {
				setRoleKey("");
				setRoleName("");
				setRoleDescription("");
				setSelectedPermissions(new Set());
				setPermissionQuery("");
			}
		});
	}

	return (
		<form
			className="@container grid min-w-0 gap-4"
			onSubmit={onSubmit}
			aria-busy={save.pending}
		>
			{!save.allowed && (
				<p className="m-0 text-sm">{adminEditingMessages[locale].readOnly}</p>
			)}
			<FieldSet disabled={locked}>
				<div className="grid gap-3 @min-[32rem]:grid-cols-2">
					<label className="grid min-w-0 gap-1.5" htmlFor={keyId}>
						<span className="text-sm font-medium text-foreground">
							{t("adminActions.roleEditor.key")}
						</span>
						<Input
							id={keyId}
							minLength={2}
							name="key"
							onChange={(fieldValue) => setRoleKey(fieldValue)}
							placeholder={t("adminActions.roleEditor.keyPlaceholder")}
							required
							value={roleKey}
						/>
					</label>
					<label className="grid min-w-0 gap-1.5" htmlFor={nameId}>
						<span className="text-sm font-medium text-foreground">
							{t("adminActions.roleEditor.name")}
						</span>
						<Input
							id={nameId}
							minLength={2}
							name="name"
							onChange={(fieldValue) => setRoleName(fieldValue)}
							placeholder={t("adminActions.roleEditor.name")}
							required
							value={roleName}
						/>
					</label>
				</div>
				<label className="grid min-w-0 gap-1.5" htmlFor={descriptionId}>
					<span className="text-sm font-medium text-foreground">
						{t("adminActions.roleEditor.description")}
					</span>
					<Textarea
						id={descriptionId}
						minLength={4}
						name="description"
						onChange={(fieldValue) => setRoleDescription(fieldValue)}
						placeholder={t("adminActions.roleEditor.description")}
						required
						value={roleDescription}
					/>
				</label>

				{!role ? (
					<div className="grid gap-2">
						<div className="text-sm font-medium text-foreground">
							{t("adminActions.roleEditor.presets")}
						</div>
						<div className="flex flex-wrap gap-2">
							{rolePresets.map((preset) => (
								<Button
									key={preset.key}
									onClick={() => applyPreset(preset)}
									size="sm"
									type="button"
									variant="outline"
								>
									{roleCopy.presetNames[preset.labelKey]}
								</Button>
							))}
						</div>
					</div>
				) : null}

				<FieldSet disabled={locked}>
					<FieldLegend variant="label">
						{t("adminActions.roleEditor.permissions")}
					</FieldLegend>
					<Input
						label={roleCopy.searchPermissions}
						type="search"
						value={permissionQuery}
						onChange={setPermissionQuery}
					/>
					{!modules.length && (
						<p role="status" className="text-sm text-muted-foreground">
							{roleCopy.noMatchingPermissions}
						</p>
					)}
					<div className="grid min-w-0 gap-6">
						{modules.map((module) => (
							<FieldSet key={module.module}>
								<FieldLegend variant="label">
									{roleCopy.groups[module.module]}
								</FieldLegend>
								<div className="grid min-w-0 gap-3 @min-[32rem]:grid-cols-2">
									{module.permissions.map((permission) => (
										<Checkbox
											key={permission.id}
											checked={selectedPermissions.has(permission.key)}
											name="permissionKeys"
											onCheckedChange={(checked) =>
												togglePermission(permission.key, checked)
											}
											value={permission.key}
											label={
												<span className="grid min-w-0 gap-0.5 break-words">
													<span>{permission.name}</span>
													<span className="text-xs font-normal text-muted-foreground">
														{permission.key}
													</span>
												</span>
											}
										/>
									))}
								</div>
							</FieldSet>
						))}
					</div>
				</FieldSet>
			</FieldSet>
			<div className="flex flex-wrap items-center gap-3">
				<Button disabled={locked} type="submit">
					{save.pending
						? t("adminActions.roleEditor.saving")
						: t("adminActions.roleEditor.save")}
				</Button>
			</div>
			{message && save.result !== "failed" ? (
				<FormError>{message}</FormError>
			) : null}
			<AdminSaveFeedback
				state={save}
				locale={locale}
				failureMessage={message || undefined}
			/>
		</form>
	);
}

type RoleEditorCopy = ReturnType<
	typeof getMessageNamespace<"adminActions">
>["roleEditor"];
type RolePreset = {
	labelKey: keyof RoleEditorCopy["presetNames"];
	key: string;
	permissions: string[];
};

const rolePresets: RolePreset[] = [
	{
		key: "support.team",
		labelKey: "admin_operations",
		permissions: ["support"],
	},
	{
		key: "settings.team",
		labelKey: "settings_manager",
		permissions: ["config"],
	},
];
const sidebarPermissionGroups: {
	module: keyof RoleEditorCopy["groups"];
	permissions: string[];
}[] = [
	{ module: "Overview", permissions: ["users"] },
	{ module: "Operations", permissions: ["access", "support", "assets"] },
	{ module: "Security", permissions: ["audit"] },
	{ module: "Settings", permissions: ["config"] },
];
function groupPermissionsBySidebar(permissions: PermissionRow[]) {
	const permissionByKey = new Map(
		permissions.map((permission) => [permission.key, permission]),
	);
	const used = new Set<string>();
	const groups = sidebarPermissionGroups
		.map((group) => {
			const rows = group.permissions
				.map((key) => permissionByKey.get(key))
				.filter((permission): permission is PermissionRow =>
					Boolean(permission),
				);
			for (const row of rows) used.add(row.key);
			return { module: group.module, permissions: rows };
		})
		.filter((group) => group.permissions.length > 0);

	const remaining = permissions.filter(
		(permission) => !used.has(permission.key),
	);
	if (remaining.length > 0) {
		groups.push({
			module: "Other",
			permissions: remaining.sort((first, second) =>
				first.key.localeCompare(second.key),
			),
		});
	}

	return groups;
}
