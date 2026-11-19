import { db, assetFor } from "./core";
export function fileLibrary(owner: string | null) {
	return db
		.prepare(
			"SELECT a.id,a.name,a.size,a.created,u.email FROM asset a JOIN user u ON u.id=a.owner WHERE (? IS NULL OR a.owner=?) ORDER BY a.created DESC,a.rowid DESC",
		)
		.all(owner, owner)
		.map((r) => ({
			id: String(r.id),
			name: String(r.name),
			bytes: Number(r.size),
			created: String(r.created),
			email: String(r.email),
		}));
}
export function personalFile(owner: string, id: string) {
	const row = assetFor(owner, id, false);
	if (!row) throw new Response("File not found", { status: 404 });
	return {
		id: String(row.id),
		name: String(row.name),
		bytes: Number(row.size),
		created: String(row.created),
	};
}
export function personalOverview(id: string) {
	const count = (table: "ticket" | "asset") =>
		Number(
			db.prepare("SELECT COUNT(*) n FROM " + table + " WHERE owner=?").get(id)
				?.n,
		);
	return { tickets: count("ticket"), files: count("asset") };
}
