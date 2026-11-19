import { access, db, permissions, log, transaction } from "./core";
export type PermissionRow = {
	id: string;
	key: string;
	name: string;
	description: string;
	module: string;
	roles: string[];
};
export type RoleRow = {
	id: string;
	key: string;
	name: string;
	description: string;
	permissions: string[];
};
export type AdminUserRow = {
	id: string;
	name: string;
	email: string;
	roles: string[];
	roleIds: string[];
	roleKeys: string[];
	status: "active" | "banned";
	createdAt: string;
	country: string;
};
export function permissionDirectory(): PermissionRow[] {
	const grants = db
		.prepare("SELECT name,permissions FROM role ORDER BY name")
		.all()
		.map((row) => ({
			name: String(row.name),
			keys: JSON.parse(String(row.permissions)) as string[],
		}));
	return permissions.map((key) => ({
		roles: grants.filter((r) => r.keys.includes(key)).map((r) => r.name),
		id: key,
		key,
		name: key,
		description: "",
		module: {
			users: "Overview",
			access: "Operations",
			support: "Operations",
			assets: "Operations",
			audit: "Security",
			config: "Settings",
		}[key],
	}));
}
export function users() {
	const rows = db
		.prepare(
			"SELECT u.id,u.name,u.email,u.createdAt,COALESCE(p.role,'member') role,COALESCE(p.disabled,0) disabled,COALESCE(p.country,'') country FROM user u LEFT JOIN profile p ON u.id=p.id ORDER BY u.createdAt DESC",
		)
		.all();
	const extra = db.prepare("SELECT user_id,role FROM extra_role").all();
	return rows.map((u): AdminUserRow => {
		const roles = [
			String(u.role),
			...extra.filter((e) => e.user_id === u.id).map((e) => String(e.role)),
		];
		return {
			id: String(u.id),
			name: String(u.name),
			email: String(u.email),
			roles,
			roleIds: roles,
			roleKeys: roles,
			status: u.disabled ? "banned" : "active",
			createdAt: new Date(
				typeof u.createdAt === "number"
					? u.createdAt < 1e11
						? u.createdAt * 1000
						: u.createdAt
					: String(u.createdAt),
			).toISOString(),
			country: String(u.country),
		};
	});
}
export function roleSnapshot() {
	const roles = db
		.prepare(
			"SELECT r.name,r.permissions,d.label,d.description FROM role r LEFT JOIN role_detail d ON d.role=r.name",
		)
		.all()
		.map(
			(r): RoleRow => ({
				id: String(r.name),
				key: String(r.name),
				name: String(r.label || r.name),
				description: String(r.description || ""),
				permissions: JSON.parse(String(r.permissions)),
			}),
		);
	return { roles, roleUsers: users(), permissions: permissionDirectory() };
}
export type UsersRbacSnapshot = ReturnType<typeof roleSnapshot>;
export function editRole(
	actor: string,
	input: {
		roleId?: string;
		key: string;
		name: string;
		description: string;
		permissionKeys: string[];
	},
) {
	const id = input.roleId ?? input.key;
	if (
		["admin", "member"].includes(id) ||
		(input.roleId && id !== input.key) ||
		!input.permissionKeys.every((p) => permissions.some((k) => p === k))
	)
		throw Error("Invalid role");
	return transaction(() => {
		if (input.roleId) {
			if (
				!db
					.prepare("UPDATE role SET permissions=? WHERE name=?")
					.run(JSON.stringify(input.permissionKeys), id).changes
			)
				throw Error("Role missing");
		} else
			db.prepare("INSERT INTO role(name,permissions) VALUES (?,?)").run(
				id,
				JSON.stringify(input.permissionKeys),
			);
		db.prepare(
			"INSERT INTO role_detail VALUES (?,?,?) ON CONFLICT(role) DO UPDATE SET label=excluded.label,description=excluded.description",
		).run(id, input.name, input.description);
		log(actor, "role.saved", id);
		return { role: { key: id } };
	});
}
export function assignRoles(actor: string, userId: string, input: string[]) {
	if (actor === userId)
		throw Error("Use a second administrator to change your own access");
	return transaction(() => {
		access(userId);
		const ids = [...new Set(input.length ? input : ["member"])];
		db.prepare("UPDATE profile SET role=? WHERE id=?").run(ids[0], userId);
		db.prepare("DELETE FROM extra_role WHERE user_id=?").run(userId);
		for (const id of ids.slice(1))
			db.prepare("INSERT INTO extra_role VALUES (?,?)").run(userId, id);
		log(actor, "user.roles", userId);
		return { assignment: { roleIds: ids } };
	});
}
export function removeRole(actor: string, id: string) {
	return transaction(() => {
		if (
			["member", "admin", "support"].includes(id) ||
			db
				.prepare(
					"SELECT 1 FROM profile WHERE role=? UNION ALL SELECT 1 FROM extra_role WHERE role=? LIMIT 1",
				)
				.get(id, id)
		)
			throw Error("Role is in use");
		db.prepare("DELETE FROM role WHERE name=?").run(id);
		log(actor, "role.deleted", id);
		return { ok: true };
	});
}
