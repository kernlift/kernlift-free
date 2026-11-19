import type { Locale } from "./messages";

const en = {
	keyExists:
		"This role key already exists. Choose a different key or edit the existing role.",
	missingRole: "This role no longer exists. Refresh the role list.",
	roleReadOnly: "Role settings are read-only.",
	permissionRequired: "Select at least one permission.",
	assignedRole: "Remove assigned members before deleting this role.",
	deleteFailed:
		"The role could not be deleted. Refresh the list and check whether it has assigned members.",
};
export const adminRbacMessages: Record<
	Locale,
	{ [K in keyof typeof en]: string }
> = {
	en,
	zh: {
		keyExists: "此角色标识已存在，请使用其他标识或编辑已有角色。",
		missingRole: "此角色已不存在，请刷新角色列表。",
		roleReadOnly: "角色设置仅可查看。",
		permissionRequired: "请至少选择一个权限。",
		assignedRole: "请先移除此角色的成员，再删除角色。",
		deleteFailed: "角色删除失败，请刷新列表并确认角色是否仍有成员。",
	},
};
