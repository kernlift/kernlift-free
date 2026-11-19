import { EditorDialog } from "@/beui/editor-dialog";
import { FieldLegend, FieldSet } from "@/beui/form-layout";
import { type FormEvent, useState } from "react";
import { AdminSaveFeedback, useAdminSave } from "@/components/admin/admin-save";
import { Button } from "@/components/motion/button";
import { Checkbox } from "@/components/motion/checkbox";
import { adminEditingMessages } from "@/i18n/admin-editing";
import { getDictionary, type Locale } from "../../i18n/messages";
import type {
	AdminUserRow,
	RoleRow,
} from "../../server/db/repositories/users-rbac.repository";
import { updateRbacUserRoles } from "../../server/functions/users-rbac";

type UserRoleActionsProps = {
	user: AdminUserRow;
	roles: RoleRow[];
	locale?: Locale;
	triggerLabel?: string;
};
export function UserRoleActions({
	user,
	roles,
	locale = "en",
	triggerLabel,
}: UserRoleActionsProps) {
	const { t } = getDictionary(locale);
	const [open, setOpen] = useState(false);
	const permission = useAdminSave("users.write");
	return (
		<>
			<Button
				onClick={() => setOpen(true)}
				disabled={!permission.allowed}
				size="sm"
				type="button"
				variant="outline"
			>
				{triggerLabel ?? t("adminActions.userRoles.save")}
			</Button>
			{open && (
				<UserRoleDialog
					user={user}
					roles={roles}
					locale={locale}
					onClose={() => setOpen(false)}
				/>
			)}
		</>
	);
}
export function UserRoleDialog({
	user,
	roles,
	locale,
	onClose,
}: {
	user: AdminUserRow;
	roles: RoleRow[];
	locale: Locale;
	onClose(): void;
}) {
	const { t } = getDictionary(locale);
	const save = useAdminSave("users.write");
	const locked = !save.allowed || save.pending || save.refreshFailed;
	const [selected, setSelected] = useState(() => new Set(user.roleIds));
	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (locked) return;
		await save.save(async () => {
			const result = await updateRbacUserRoles({
				data: { userId: user.id, roleIds: [...selected] },
			});
			setSelected(new Set(result.assignment.roleIds));
		});
	}
	return (
		<EditorDialog
			open
			dismissible={!save.pending}
			onOpenChange={(next) => {
				if (!next && !save.pending) onClose();
			}}
			title={t("adminActions.userRoles.title")}
			description={user.email}
			closeLabel={t("rolesCopy.close")}
		>
			<form
				onSubmit={submit}
				aria-busy={save.pending}
				className="@container grid min-w-0 gap-4"
			>
				{!save.allowed && (
					<p className="m-0 text-sm">{adminEditingMessages[locale].readOnly}</p>
				)}
				<FieldSet disabled={locked}>
					<FieldLegend variant="label">
						{t("adminActions.userRoles.roles")}
					</FieldLegend>
					<div className="grid min-w-0 gap-3 @min-[32rem]:grid-cols-2">
						{roles.map((role) => (
							<Checkbox
								key={role.id}
								checked={selected.has(role.id)}
								name="roleIds"
								value={role.id}
								onCheckedChange={(checked) =>
									setSelected((current) => {
										const next = new Set(current);
										if (checked) next.add(role.id);
										else next.delete(role.id);
										return next;
									})
								}
								label={
									<span className="grid min-w-0 gap-0.5 break-words">
										<span>{role.name}</span>
										<span className="text-xs font-normal text-muted-foreground">
											{role.key}
										</span>
									</span>
								}
							/>
						))}
					</div>
				</FieldSet>
				<AdminSaveFeedback state={save} locale={locale} />
				<div className="flex flex-wrap justify-end gap-2">
					<Button
						disabled={save.pending}
						variant="outline"
						type="button"
						onClick={onClose}
					>
						{t("rolesCopy.close")}
					</Button>
					<Button disabled={locked} type="submit">
						{save.pending
							? t("adminActions.userRoles.saving")
							: t("adminActions.userRoles.save")}
					</Button>
				</div>
			</form>
		</EditorDialog>
	);
}
