import { DatabaseSync } from "node:sqlite";
import { dirname } from "node:path";
import { mkdirSync } from "node:fs";
import {
	createCipheriv,
	createDecipheriv,
	createHash,
	randomBytes,
	randomUUID,
} from "node:crypto";

try {
	process.loadEnvFile();
} catch (error) {
	if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
}
export const appURL = new URL(process.env.APP_URL || "http://localhost:5173")
	.origin;
export const secret = process.env.AUTH_SECRET || "";
const path = process.env.DATABASE_PATH || "./data/free.db";
mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
export const db = new DatabaseSync(path);
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
CREATE TABLE IF NOT EXISTS role (name TEXT PRIMARY KEY,permissions TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS profile (id TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' REFERENCES role(name),country TEXT NOT NULL DEFAULT '',
  disabled INTEGER NOT NULL DEFAULT 0, notifications INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS ticket (id TEXT PRIMARY KEY,owner TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  title TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'open',assignee TEXT,created TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS reply (id TEXT PRIMARY KEY,ticket TEXT NOT NULL REFERENCES ticket(id) ON DELETE CASCADE,
  author TEXT REFERENCES user(id) ON DELETE SET NULL,message TEXT NOT NULL,created TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS asset (id TEXT PRIMARY KEY,owner TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  name TEXT NOT NULL,size INTEGER NOT NULL,created TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS setting (key TEXT PRIMARY KEY,value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS audit (id INTEGER PRIMARY KEY,actor TEXT NOT NULL,action TEXT NOT NULL,target TEXT NOT NULL,created TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
`);
db.exec(`CREATE TABLE IF NOT EXISTS ticket_detail(ticket TEXT PRIMARY KEY REFERENCES ticket(id) ON DELETE CASCADE,priority TEXT NOT NULL DEFAULT 'normal',sla TEXT NOT NULL DEFAULT 'within_sla',locale TEXT NOT NULL DEFAULT 'en');
CREATE TABLE IF NOT EXISTS staff_note(id INTEGER PRIMARY KEY,ticket TEXT REFERENCES ticket(id) ON DELETE CASCADE,author TEXT,body TEXT,created TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS role_detail(role TEXT PRIMARY KEY REFERENCES role(name) ON DELETE CASCADE,label TEXT,description TEXT);
CREATE TABLE IF NOT EXISTS extra_role(user_id TEXT REFERENCES user(id) ON DELETE CASCADE,role TEXT REFERENCES role(name) ON DELETE CASCADE,PRIMARY KEY(user_id,role));`);
export const permissions = [
	"users",
	"access",
	"support",
	"assets",
	"audit",
	"config",
] as const;
export type Permission = (typeof permissions)[number];
const seedRole = db.prepare("INSERT OR IGNORE INTO role VALUES (?,?)");
seedRole.run("member", "[]");
seedRole.run("support", JSON.stringify(["support"]));
seedRole.run("admin", JSON.stringify(permissions));

export function access(id: string) {
	db.prepare("INSERT OR IGNORE INTO profile(id) VALUES (?)").run(id);
	const row = db
		.prepare(
			"SELECT p.*,r.permissions FROM profile p JOIN role r ON r.name=p.role WHERE id=?",
		)
		.get(id)!;
	return {
		role: String(row.role),
		disabled: Boolean(row.disabled),
		country: String(row.country),
		notifications: Boolean(row.notifications),
		permissions: [
			...new Set(
				[
					row,
					...db
						.prepare(
							"SELECT r.permissions FROM role r JOIN extra_role e ON e.role=r.name WHERE e.user_id=?",
						)
						.all(id),
				].flatMap((r) => JSON.parse(String(r.permissions)) as Permission[]),
			),
		],
	};
}
export function log(actor: string, action: string, target: string) {
	db.prepare("INSERT INTO audit(actor,action,target) VALUES (?,?,?)").run(
		actor,
		action,
		target,
	);
}
export function transaction<T>(work: () => T) {
	db.exec("BEGIN IMMEDIATE");
	try {
		const result = work();
		db.exec("COMMIT");
		return result;
	} catch (error) {
		db.exec("ROLLBACK");
		throw error;
	}
}
export const settingsKeys = [
	"emailPassword",
	"requireVerification",
	"smtpHost",
	"smtpPort",
	"smtpUser",
	"smtpPassword",
	"mailFrom",
	"smtpSecure",
	"googleId",
	"googleSecret",
	"googleOneTap",
	"githubId",
	"githubSecret",
	"bucketName",
	"endpoint",
	"region",
	"accessKeyId",
	"secretAccessKey",
] as const;
export type SettingKey = (typeof settingsKeys)[number];
const secrets = new Set<string>([
	"smtpPassword",
	"googleSecret",
	"githubSecret",
	"secretAccessKey",
]);
function encryptionKey() {
	if (secret.length < 32)
		throw new Error("Run pnpm setup to create AUTH_SECRET");
	return createHash("sha256").update(secret).digest();
}
export function settings(reveal = false) {
	const output = Object.fromEntries(
		settingsKeys.map((key) => [key, ""]),
	) as Record<SettingKey, string>;
	for (const row of db.prepare("SELECT key,value FROM setting").all()) {
		const key = String(row.key) as SettingKey;
		if (!secrets.has(key)) {
			output[key] = String(row.value);
			continue;
		}
		if (!reveal) continue;
		output[key] = decryptSetting(String(row.value)) ?? "";
	}
	return output;
}
/**
 * One stored secret in plain text, or null when it cannot be read: a different AUTH_SECRET, a
 * damaged row or a value that was never encrypted. Callers see an unreadable secret as unset, so
 * one bad credential disables its provider instead of every sign-in.
 */
export function decryptSetting(value: string) {
	const [iv, tag, data] = value.split(".");
	if (!iv || !tag || data === undefined) return null;
	try {
		const decipher = createDecipheriv(
			"aes-256-gcm",
			encryptionKey(),
			Buffer.from(iv, "hex"),
		);
		decipher.setAuthTag(Buffer.from(tag, "hex"));
		return Buffer.concat([
			decipher.update(Buffer.from(data, "hex")),
			decipher.final(),
		]).toString();
	} catch {
		return null;
	}
}
/** Stored secrets that cannot be decrypted with the current AUTH_SECRET. */
export function unreadableSecrets() {
	return db
		.prepare("SELECT key,value FROM setting")
		.all()
		.filter(
			(row) =>
				secrets.has(String(row.key)) &&
				decryptSetting(String(row.value)) === null,
		)
		.map((row) => String(row.key) as SettingKey);
}
/** What sign-in and the auth pages may know about the configured providers. */
export function providerFlags() {
	const s = settings(true);
	const google = Boolean(s.googleId && s.googleSecret);
	const github = Boolean(s.githubId && s.githubSecret);
	return {
		// Saving refuses to turn password sign-in off without a social provider; reading applies the
		// same rule, so an unreadable OAuth secret can never leave the site with no way in.
		emailPassword: s.emailPassword !== "off" || !(google || github),
		github,
		google,
		email: Boolean(s.smtpHost && s.mailFrom),
		// The public client ID only; One Tap needs Google sign-in to be configured.
		googleOneTapClientId:
			google && s.googleOneTap === "on" ? s.googleId : null,
	};
}
export function saveSettings(form: FormData, actor: string) {
	transaction(() => {
		for (const key of settingsKeys) {
			if (!form.has(key)) continue;
			let value = String(form.get(key) ?? "").trim();
			if (secrets.has(key)) {
				if (!value) continue;
				const iv = randomBytes(12),
					cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
				const data = Buffer.concat([cipher.update(value), cipher.final()]);
				value = [iv, cipher.getAuthTag(), data]
					.map((b) => b.toString("hex"))
					.join(".");
			}
			db.prepare(
				"INSERT INTO setting VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
			).run(key, value);
		}
		const config = settings(true);
		if (
			config.requireVerification === "on" &&
			!(config.mailFrom && config.smtpHost)
		)
			throw new Response("Configure SMTP before requiring verified email.", {
				status: 400,
			});
		if (
			config.emailPassword === "off" &&
			!(
				(config.githubId && config.githubSecret) ||
				(config.googleId && config.googleSecret)
			)
		)
			throw new Response(
				"Configure a social sign-in provider before disabling password sign-in.",
				{ status: 400 },
			);
		log(actor, "settings.updated", "providers");
	});
}
export function createTicket(
	owner: string,
	title: string,
	message: string,
	priority = "normal",
	locale = "en",
) {
	return transaction(() => {
		const id = randomUUID();
		db.prepare("INSERT INTO ticket(id,owner,title) VALUES (?,?,?)").run(
			id,
			owner,
			title,
		);
		addReply(id, owner, message);
		db.prepare(
			"INSERT INTO ticket_detail(ticket,priority,locale) VALUES (?,?,?)",
		).run(id, priority, locale);
		return id;
	});
}
export function addReply(ticket: string, user: string, message: string) {
	db.prepare(
		"INSERT INTO reply(id,ticket,author,message) VALUES (?,?,?,?)",
	).run(randomUUID(), ticket, user, message);
}
export function ticketFor(user: string, id: string, staff: boolean) {
	return db
		.prepare("SELECT * FROM ticket WHERE id=? AND (owner=? OR ?=1)")
		.get(id, user, Number(staff));
}
export function userDirectory() {
	return db
		.prepare(
			"SELECT u.id,u.name,u.email,coalesce(p.role,'member') role,coalesce(p.disabled,0) disabled FROM user u LEFT JOIN profile p ON p.id=u.id ORDER BY u.createdAt DESC",
		)
		.all();
}
export function assetFor(user: string, id: string, staff: boolean) {
	return db
		.prepare("SELECT * FROM asset WHERE id=? AND (owner=? OR ?=1)")
		.get(id, user, Number(staff));
}
