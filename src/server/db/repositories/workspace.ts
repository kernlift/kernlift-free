import { randomUUID } from "node:crypto";
import {
	appURL,
	access,
	addReply,
	assetFor,
	createTicket,
	db,
	log,
	permissions,
	saveSettings,
	settings,
	unreadableSecrets,
	ticketFor,
	transaction,
	userDirectory,
} from "./core";
import type { Permission } from "./core";
import { sendMail, type identity } from "../../auth/context";
import { signRequest, presignUrl } from "../../storage";

type Actor = NonNullable<Awaited<ReturnType<typeof identity>>>;
const reject = (status: number, message: string): never => {
	throw new Response(message, { status });
};
function allow(actor: Actor, scope: Permission) {
	if (!actor.permissions.includes(scope)) reject(403, "Permission denied");
}
function text(form: FormData, key: string, max = 2000) {
	const value = form.get(key);
	if (typeof value !== "string" || !value.trim() || value.length > max)
		throw new Response("Invalid " + key, { status: 400 });
	return value.trim();
}
function storage() {
	const s = settings(true);
	if (!s.bucketName || !s.endpoint || !s.accessKeyId || !s.secretAccessKey)
		reject(503, "Configure private S3 storage in Admin settings.");
	return { ...s, region: s.region || "us-east-1" };
}
export async function read(actor: Actor, section: string, id: string) {
	const uid = actor.user.id;
	switch (section) {
		case "account":
			return {
				id: uid,
				name: actor.user.name,
				email: actor.user.email,
				emailVerified: actor.user.emailVerified,
				role: actor.role,
				permissions: actor.permissions,
				country: actor.country,
				notifications: actor.notifications,
				mailConfigured: Boolean(settings().mailFrom),
			};
		case "home":
			return {
				tickets: db
					.prepare("SELECT count(*) n FROM ticket WHERE owner=?")
					.get(uid)?.n,
				files: db.prepare("SELECT count(*) n FROM asset WHERE owner=?").get(uid)
					?.n,
			};
		case "tickets":
		case "support": {
			const staff = section === "support";
			if (staff) allow(actor, "support");
			if (!id)
				return db
					.prepare(
						"SELECT * FROM ticket WHERE owner=? OR ?=1 ORDER BY created DESC,rowid DESC",
					)
					.all(uid, Number(staff));
			const ticket = ticketFor(uid, id, staff);
			if (!ticket) reject(404, "Ticket not found");
			return {
				ticket,
				replies: db
					.prepare(
						"SELECT r.message,r.created,u.name FROM reply r LEFT JOIN user u ON u.id=r.author WHERE ticket=? ORDER BY r.rowid",
					)
					.all(id),
			};
		}
		case "files":
		case "assets": {
			const staff = section === "assets";
			if (staff) allow(actor, "assets");
			if (!id)
				return db
					.prepare(
						"SELECT id,name,size,created FROM asset WHERE owner=? OR ?=1 ORDER BY created DESC,rowid DESC",
					)
					.all(uid, Number(staff));
			const file = assetFor(uid, id, staff);
			if (!file) throw new Response("File not found", { status: 404 });
			return Response.redirect(
				presignUrl(storage(), String(file.owner) + "/" + id, 60),
				302,
			);
		}
		case "overview":
			allow(actor, "users");
			return db
				.prepare(
					"SELECT (SELECT COUNT(*) FROM user) users,(SELECT COUNT(*) FROM ticket WHERE status<>'closed') openTickets,(SELECT COUNT(*) FROM asset) files",
				)
				.get();
		case "countries":
			allow(actor, "users");
			return db
				.prepare(
					"SELECT COALESCE(NULLIF(p.country,''),'Unknown') country,COUNT(*) users FROM user u LEFT JOIN profile p ON p.id=u.id GROUP BY 1 ORDER BY 2 DESC",
				)
				.all();
		case "users":
			allow(actor, "users");
			return userDirectory();
		case "roles":
		case "permissions":
			allow(actor, "access");
			return {
				permissions,
				roles: db.prepare("SELECT * FROM role ORDER BY name").all(),
			};
		case "audit":
			allow(actor, "audit");
			return db.prepare("SELECT * FROM audit ORDER BY id DESC LIMIT 150").all();
		case "settings":
			allow(actor, "config");
			return { ...settings(), unreadable: unreadableSecrets() };
		case "setup":
			allow(actor, "config");
			{
				const s = settings(true);
				return {
					database: true,
					authentication: true,
					secrets: unreadableSecrets().length === 0,
					mail: Boolean(s.mailFrom && s.smtpHost),
					storage: Boolean(
						s.bucketName && s.endpoint && s.accessKeyId && s.secretAccessKey,
					),
				};
			}
		default:
			return reject(404, "Unknown page");
	}
}
export async function write(
	actor: Actor,
	section: string,
	id: string,
	form: FormData,
) {
	const uid = actor.user.id;
	switch (section) {
		case "profile": {
			const country = String(form.get("country") ?? "")
				.toUpperCase()
				.trim();
			if (country && !/^[A-Z]{2}$/.test(country))
				reject(400, "Enter a two-letter country code.");
			db.prepare("UPDATE profile SET country=?,notifications=? WHERE id=?").run(
				country,
				Number(form.get("notifications") === "on"),
				uid,
			);
			return;
		}
		case "tickets":
		case "support": {
			const staff = section === "support";
			if (staff) allow(actor, "support");
			if (!id)
				return {
					id: createTicket(
						uid,
						text(form, "title", 140),
						text(form, "message", 4000),
					),
				};
			if (!ticketFor(uid, id, staff)) reject(404, "Ticket not found");
			if (form.has("message")) {
				transaction(() => {
					addReply(id, uid, text(form, "message", 4000));
					if (staff) log(uid, "ticket.replied", id);
				});
				if (staff) {
					const recipient = db
						.prepare(
							"SELECT u.email,p.notifications FROM ticket t JOIN user u ON t.owner=u.id LEFT JOIN profile p ON p.id=u.id WHERE t.id=? AND u.id<>?",
						)
						.get(id, uid);
					if (
						recipient &&
						recipient.notifications !== 0 &&
						settings().smtpHost
					) {
						try {
							await sendMail(
								String(recipient.email),
								"Support replied to your ticket",
								appURL + "/app/tickets/" + id,
							);
						} catch {
							log(uid, "ticket.email_failed", id);
						}
					}
				}
			} else if (staff) {
				const status = text(form, "status", 12);
				if (!["open", "closed", "waiting"].includes(status))
					reject(400, "Invalid ticket status");
				transaction(() => {
					db.prepare("UPDATE ticket SET status=?,assignee=? WHERE id=?").run(
						status,
						String(form.get("assignee") ?? "").slice(0, 120),
						id,
					);
					log(uid, "ticket.updated", id);
				});
			} else reject(400, "Reply required");
			return;
		}
		case "files": {
			const file = form.get("file");
			if (!(file instanceof File) || !file.size || file.size > 8 * 1024 * 1024)
				throw new Response("Choose a file of up to 8 MiB", { status: 400 });
			const config = storage(),
				key = randomUUID(),
				bytes = Buffer.from(await file.arrayBuffer());
			const object = uid + "/" + key,
				signed = signRequest(config, "PUT", object, bytes, {
					"content-type": "application/octet-stream",
				});
			const result = await fetch(signed.url, {
				method: "PUT",
				headers: signed.headers,
				body: new Uint8Array(bytes),
			});
			if (!result.ok) reject(502, "Object storage rejected the upload.");
			try {
				db.prepare(
					"INSERT INTO asset(id,owner,name,size) VALUES (?,?,?,?)",
				).run(key, uid, file.name.slice(0, 255), file.size);
			} catch (error) {
				const cleanup = signRequest(
					config,
					"DELETE",
					object,
					Buffer.alloc(0),
					{},
				);
				await fetch(cleanup.url, {
					method: "DELETE",
					headers: cleanup.headers,
				});
				throw error;
			}
			return;
		}
		case "user-status": {
			allow(actor, "users");
			allow(actor, "access");
			if (uid === id)
				reject(400, "Use a second administrator to change your own access.");
			if (!db.prepare("SELECT 1 FROM user WHERE id=?").get(id))
				reject(404, "User not found");
			transaction(() => {
				access(id);
				db.prepare("UPDATE profile SET disabled=? WHERE id=?").run(
					Number(form.get("disabled") === "on"),
					id,
				);
				log(uid, "account.status", id);
			});
			return;
		}
		case "users": {
			allow(actor, "access");
			allow(actor, "users");
			if (uid === id)
				reject(400, "Use a second administrator to change your own access.");
			if (!db.prepare("SELECT id FROM user WHERE id=?").get(id))
				reject(404, "User not found");
			const role = text(form, "role", 80);
			if (!db.prepare("SELECT name FROM role WHERE name=?").get(role))
				reject(400, "Unknown role");
			transaction(() => {
				access(id);
				db.prepare("DELETE FROM extra_role WHERE user_id=?").run(id);
				db.prepare("UPDATE profile SET role=?, disabled=? WHERE id=?").run(
					role,
					Number(form.get("disabled") === "on"),
					id,
				);
				log(uid, "account.access", id);
			});
			return;
		}
		case "roles": {
			allow(actor, "access");
			const name = text(form, "name", 60);
			if (["admin", "member"].includes(name))
				reject(400, "The two built-in roles are reserved.");
			const rules = form.getAll("permission").map(String);
			if (rules.some((v) => !permissions.includes(v as Permission)))
				reject(400, "Unknown permission");
			transaction(() => {
				db.prepare(
					"INSERT INTO role VALUES (?,?) ON CONFLICT(name) DO UPDATE SET permissions=excluded.permissions",
				).run(name, JSON.stringify(rules));
				log(uid, "role.saved", name);
			});
			return;
		}
		case "settings":
			allow(actor, "config");
			saveSettings(form, uid);
			return;
		default:
			return reject(404, "Unknown action");
	}
}
