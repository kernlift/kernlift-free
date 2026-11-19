import { db, transaction, addReply, log, ticketFor } from "./core";
export type Priority = "low" | "normal" | "high" | "urgent";
export type Status = "triage" | "in_progress" | "waiting" | "closed";
export type Sla = "within_sla" | "at_risk" | "breached";
export function tickets(owner: string | null, id: string | null = null) {
	const rows = db
		.prepare(`SELECT t.*,u.email,d.priority,d.sla,d.locale,
 COALESCE((SELECT max(r.created) FROM reply r WHERE r.ticket=t.id),t.created) updated
 FROM ticket t JOIN user u ON t.owner=u.id LEFT JOIN ticket_detail d ON d.ticket=t.id
 WHERE (? IS NULL OR t.owner=?) AND (? IS NULL OR t.id=?) ORDER BY updated DESC,t.rowid DESC`)
		.all(owner, owner, id, id);
	return {
		supportTickets: rows.map((r) => ({
			id: String(r.id),
			conversationId: String(r.id),
			summary: String(r.title),
			status: (r.status === "open" ? "triage" : r.status) as Status,
			assignee: String(r.assignee || ""),
			slaStatus: (r.sla || "within_sla") as Sla,
			createdAt: String(r.created),
			updatedAt: String(r.updated),
		})),
		supportConversations: rows.map((r) => ({
			id: String(r.id),
			requesterEmail: String(r.email),
			subject: String(r.title),
			status: (r.status === "closed"
				? "resolved"
				: r.status === "waiting"
					? "pending"
					: "open") as "open" | "pending" | "resolved",
			provider: "manual" as const,
			priority: (r.priority || "normal") as Priority,
			locale: (r.locale === "zh" ? "zh" : "en") as "zh" | "en",
			lastMessageAt: String(r.updated),
			createdAt: String(r.created),
		})),
	};
}
export function thread(owner: string | null, id: string) {
	const {
		supportTickets: [ticket],
		supportConversations: [conversation],
	} = tickets(owner, id);
	if (!ticket) throw Error("Ticket not found");
	const publicRows = db
		.prepare(
			`SELECT r.id,r.created,r.message body,COALESCE(u.name,'—') authorName,CASE WHEN t.owner=r.author THEN 'user' ELSE 'support' END authorType,'public' visibility FROM reply r JOIN ticket t ON t.id=r.ticket LEFT JOIN user u ON u.id=r.author WHERE r.ticket=? ORDER BY r.created,r.rowid`,
		)
		.all(id);
	const notes =
		owner === null
			? db
					.prepare(
						"SELECT id,created,body,author authorName,'support' authorType,'internal' visibility FROM staff_note WHERE ticket=? ORDER BY id",
					)
					.all(id)
			: [];
	const messages = [...publicRows, ...notes]
		.sort((a, b) => String(a.created).localeCompare(String(b.created)))
		.map((r) => ({
			id: String(r.visibility) + r.id,
			createdAt: String(r.created),
			body: String(r.body),
			authorName: String(r.authorName),
			authorType: r.authorType as "user" | "support",
			visibility: r.visibility as "public" | "internal",
		}));
	return { ticket, conversation, messages };
}
export function replyToTicket(
	owner: string,
	input: { ticketId: string; body: string; status: Status; priority: Priority },
) {
	return transaction(() => {
		if (!ticketFor(owner, input.ticketId, false))
			throw Error("Ticket not found");
		addReply(input.ticketId, owner, input.body);
		db.prepare("UPDATE ticket SET status=? WHERE id=?").run(
			input.status,
			input.ticketId,
		);
		db.prepare(
			"INSERT INTO ticket_detail(ticket,priority) VALUES (?,?) ON CONFLICT(ticket) DO UPDATE SET priority=excluded.priority",
		).run(input.ticketId, input.priority);
	});
}
export function assignTicket(
	actor: string,
	input: {
		ticketId: string;
		assignee: string;
		status: Status;
		priority: Priority;
		slaStatus: Sla;
		note?: string;
	},
) {
	return transaction(() => {
		if (
			!db
				.prepare("UPDATE ticket SET status=?,assignee=? WHERE id=?")
				.run(input.status, input.assignee, input.ticketId).changes
		)
			throw Error("Ticket not found");
		db.prepare(
			"INSERT INTO ticket_detail(ticket,priority,sla) VALUES (?,?,?) ON CONFLICT(ticket) DO UPDATE SET priority=excluded.priority,sla=excluded.sla",
		).run(input.ticketId, input.priority, input.slaStatus);
		if (input.note?.trim())
			db.prepare(
				"INSERT INTO staff_note(ticket,author,body) VALUES (?,?,?)",
			).run(input.ticketId, actor, input.note);
		log(actor, "ticket.updated", input.ticketId);
	});
}
