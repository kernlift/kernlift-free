import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

test("Free roles, ticket visibility and registration reports share actual account data", async (t) => {
	const dir = mkdtempSync(join(tmpdir(), "kernlift-foundation-"));
	process.env.DATABASE_PATH = join(dir, "foundation.db");
	process.env.AUTH_SECRET = randomBytes(32).toString("hex");
	process.env.APP_URL = "http://localhost:5173";
	const { getAuth } = await import("../../src/server/auth/context.ts");
	const { access, createTicket, db } = await import(
		"../../src/server/db/repositories/core.ts"
	);
	t.after(() => {
		db.close();
		rmSync(dir, { recursive: true, force: true });
	});
	const { editRole, assignRoles, permissionDirectory, removeRole } =
		await import("../../src/server/db/repositories/users-rbac.repository.ts");
	const { assignTicket, thread, tickets } = await import(
		"../../src/server/db/repositories/support.repository.ts"
	);
	const { registrationReport } = await import(
		"../../src/server/db/repositories/registrations.ts"
	);
	const auth = await getAuth();
	const ids = [];
	for (const name of ["customer", "operator", "other"]) {
		const { user } = await auth.api.signUpEmail({
			body: {
				name,
				email: name + "@example.test",
				password: randomBytes(16).toString("hex"),
			},
		});
		access(user.id);
		ids.push(user.id);
	}
	const [customer, operator, other] = ids;
	const key = "support.lead";
	editRole(operator, {
		key,
		name: "Support lead",
		description: "",
		permissionKeys: ["support", "users"],
	});
	assignRoles(operator, other, [key, "member"]);
	assert.deepEqual(
		new Set(access(other).permissions),
		new Set(["support", "users"]),
	);
	assert.ok(
		permissionDirectory()
			.find((p) => p.key === "support")
			.roles.includes(key),
	);
	assert.throws(() => removeRole(operator, key));
	assignRoles(operator, other, ["member"]);
	removeRole(operator, key);
	assert.deepEqual(access(other).permissions, []);
	const id = createTicket(
		customer,
		"Account question",
		"Original message",
		"high",
		"zh",
	);
	assignTicket(operator, {
		ticketId: id,
		status: "closed",
		priority: "high",
		slaStatus: "within_sla",
		assignee: "Support",
		note: "Staff only",
	});
	assert.equal(tickets(customer).supportTickets[0].status, "closed");
	assert.ok(thread(null, id).messages.some((m) => m.body === "Staff only"));
	assert.deepEqual(
		thread(customer, id).messages.map((m) => m.body),
		["Original message"],
	);
	assert.throws(() => thread(other, id));
	db.prepare("UPDATE profile SET country='CN' WHERE id=?").run(customer);
	const report = registrationReport(7);
	assert.equal(report.total, 3);
	assert.equal(report.newUsers, 3);
	assert.equal(report.trend.length, 7);
	assert.equal(report.countries.find((c) => c.country === "CN").count, 1);
	assert.equal(report.openTickets, 0);
});
