import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireActor } from "../auth/guards";
import { createTicket } from "../db/repositories/core";
import {
	assignTicket,
	replyToTicket,
	thread,
	tickets,
} from "../db/repositories/support.repository";
const ticketId = z.string().min(1),
	priority = z.enum(["normal", "low", "high", "urgent"]),
	status = z.enum(["triage", "waiting", "in_progress", "closed"]);
const body = z.string().trim().min(1).max(4000);
export const getAnalyticsSupport = createServerFn({ method: "GET" }).handler(
	async () => tickets((await requireActor()).user.id),
);
export const getAdminAnalyticsSupport = createServerFn({ method: "GET" })
	.validator(z.object({ permission: z.literal("support.read") }))
	.handler(async () => {
		await requireActor("support");
		return tickets(null);
	});
export const getSupportTicketById = createServerFn({ method: "GET" })
	.validator(z.object({ ticketId }))
	.handler(async ({ data }) => {
		await requireActor("support");
		return thread(null, data.ticketId);
	});
export const getUserSupportTicketById = createServerFn({ method: "GET" })
	.validator(z.object({ ticketId }))
	.handler(async ({ data }) =>
		thread((await requireActor()).user.id, data.ticketId),
	);
export const replySupportTicket = createServerFn({ method: "POST" })
	.validator(z.object({ ticketId, body, status, priority }))
	.handler(async ({ data }) => {
		replyToTicket((await requireActor()).user.id, data);
		return { ok: true };
	});
export const createSupportTicket = createServerFn({ method: "POST" })
	.validator(
		z.object({
			subject: z.string().trim().min(1).max(140),
			body,
			priority,
			locale: z.enum(["en", "zh"]),
		}),
	)
	.handler(async ({ data }) => {
		const actor = await requireActor();
		const id = createTicket(
			actor.user.id,
			data.subject,
			data.body,
			data.priority,
			data.locale,
		);
		return { id };
	});
export const updateSupportTicketAssignment = createServerFn({ method: "POST" })
	.validator(
		z.object({
			ticketId,
			assignee: z.string().max(120),
			priority,
			status,
			slaStatus: z.enum(["within_sla", "at_risk", "breached"]),
			note: z.string().max(4000).optional(),
		}),
	)
	.handler(async ({ data }) => {
		assignTicket((await requireActor("support")).user.id, data);
		return { ok: true };
	});
