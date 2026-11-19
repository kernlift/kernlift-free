import { DatabaseSync } from "node:sqlite";
try {
	process.loadEnvFile();
} catch (e) {
	if (e.code !== "ENOENT") throw e;
}
const id = process.argv[2];
if (!id) throw Error("Usage: pnpm admin <registered user id>");
const db = new DatabaseSync(process.env.DATABASE_PATH || "./data/free.db");
if (!db.prepare("select id from user where id=?").get(id))
	throw Error("Unknown user id");
db.exec("BEGIN IMMEDIATE");
db.prepare(
	"INSERT INTO profile(id,role) VALUES (?,'admin') ON CONFLICT(id) DO UPDATE SET role='admin',disabled=0",
).run(id);
db.prepare(
	"INSERT INTO audit(actor,action,target) VALUES ('local operator','bootstrap admin',?)",
).run(id);
db.exec("COMMIT");
console.log("Administrator access granted.");
