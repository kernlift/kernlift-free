import { db } from "./core";
export function auditSnapshot() {
	const auditLogs = db
		.prepare(
			"SELECT a.id,COALESCE(u.email,a.actor) actor,a.action,a.target,a.created FROM audit a LEFT JOIN user u ON u.id=a.actor ORDER BY a.id DESC LIMIT 1000",
		)
		.all()
		.map((r) => ({
			id: String(r.id),
			actor: String(r.actor),
			action: String(r.action),
			target: String(r.target),
			createdAt: String(r.created),
			metadata: "",
		}));
	const cell = (s: string) =>
		'"' + (/^[=+@\-\t\r]/.test(s) ? "'" : "") + s.replaceAll('"', '""') + '"';
	const csv = [
		"time,actor,action,target",
		...auditLogs.map((r) =>
			[r.createdAt, r.actor, r.action, r.target].map(cell).join(","),
		),
	].join("\r\n");
	return {
		auditLogs,
		auditExport: {
			csv,
			generatedAt: new Date().toISOString(),
			rowCount: auditLogs.length,
		},
	};
}
export type SecurityAuditSnapshot = ReturnType<typeof auditSnapshot>;
