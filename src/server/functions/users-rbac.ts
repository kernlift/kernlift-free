import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
	assignRoles,
	editRole,
	permissionDirectory,
	removeRole,
	roleSnapshot,
} from "../db/repositories/users-rbac.repository";
import { requireActor } from "../auth/guards";
export const getUsersRbac = createServerFn({ method: "GET" })
	.validator(
		z.object({
			includeRoleUsers: z.boolean().optional(),
			pageSize: z.number().optional(),
		}),
	)
	.handler(async () => {
		await requireActor("access");
		return roleSnapshot();
	});
export const getAdminPermissionDirectory = createServerFn({
	method: "GET",
}).handler(async () => {
	await requireActor("access");
	return { permissions: permissionDirectory() };
});
export const saveRbacRole = createServerFn({ method: "POST" })
	.validator(
		z.object({
			roleId: z.string().optional(),
			key: z.string().min(2).max(80),
			name: z.string().min(1).max(120),
			description: z.string().max(2000),
			permissionKeys: z.array(z.string()).min(1),
		}),
	)
	.handler(async ({ data }) =>
		editRole((await requireActor("access")).user.id, data),
	);
export const deleteRbacRole = createServerFn({ method: "POST" })
	.validator(z.object({ roleId: z.string() }))
	.handler(async ({ data }) =>
		removeRole((await requireActor("access")).user.id, data.roleId),
	);
export const updateRbacUserRoles = createServerFn({ method: "POST" })
	.validator(z.object({ userId: z.string(), roleIds: z.array(z.string()) }))
	.handler(async ({ data }) =>
		assignRoles(
			(await requireActor("access")).user.id,
			data.userId,
			data.roleIds,
		),
	);
