import { createServerFn } from "@tanstack/react-start";
import { auditSnapshot } from "../db/repositories/security-audit.repository";
import { requireActor } from "../auth/guards";
export const getSecurityAudit = createServerFn({ method: "GET" }).handler(
	async () => {
		await requireActor("audit");
		return auditSnapshot();
	},
);
