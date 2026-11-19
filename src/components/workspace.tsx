import { workspaceLinks } from "../extensions";
import { useEffect, useState } from "react";
import { api, auth, Form, Field } from "./forms";
type Row = Record<string, string | number>;
type Account = {
	id: string;
	name: string;
	email: string;
	emailVerified: boolean;
	role: string;
	permissions: string[];
	country: string;
	notifications: boolean;
	mailConfigured: boolean;
};
type RoleData = { permissions: string[]; roles: Row[] };
const adminTabs = [
	["overview", "Dashboard", "users"],
	["users", "Users", "users"],
	["countries", "Countries", "users"],
	["roles", "Roles", "access"],
	["permissions", "Permissions", "access"],
	["support", "Support", "support"],
	["assets", "Assets", "assets"],
	["audit", "Audit", "audit"],
	["settings", "Settings", "config"],
	["setup", "Setup", "config"],
];
const appTabs = [
	["home", "Dashboard"],
	["profile", "My account"],
	["tickets", "My tickets"],
	["files", "My files"],
];
function url(admin: boolean, key: string, id = "") {
	const base = admin ? "/admin" : "/app";
	const path =
		({ home: "", overview: "", files: "/assets" } as Record<string, string>)[
			key
		] ?? "/" + key;
	return base + path + (id ? "/" + encodeURIComponent(id) : "");
}
function Records({ rows, link }: { rows: Row[]; link?: (r: Row) => string }) {
	if (!rows.length) return <p>No records yet.</p>;
	const keys = Object.keys(rows[0]).filter((k) => !["owner", "id"].includes(k));
	return (
		<div className="table">
			<table>
				<thead>
					<tr>
						{keys.map((k) => (
							<th key={k}>{k}</th>
						))}
						{link && <th>Details</th>}
					</tr>
				</thead>
				<tbody>
					{rows.map((row, i) => (
						<tr key={row.id ?? i}>
							{keys.map((k) => (
								<td key={k}>{row[k] ?? "—"}</td>
							))}
							{link && (
								<td>
									<a href={link(row)}>Open</a>
								</td>
							)}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
function Settings({
	data,
	save,
}: {
	data: Row;
	save: (f: FormData) => Promise<void>;
}) {
	const groups = {
		Email: [
			"smtpHost",
			"smtpPort",
			"smtpSecure",
			"smtpUser",
			"smtpPassword",
			"mailFrom",
		],
		"Social sign-in": ["githubId", "githubSecret", "googleId", "googleSecret"],
		"Private S3 storage": [
			"endpoint",
			"region",
			"bucketName",
			"accessKeyId",
			"secretAccessKey",
		],
	};
	return (
		<>
			{Object.entries(groups).map(([title, keys]) => (
				<section className="panel" key={title}>
					<h2>{title}</h2>
					<Form submit={save}>
						{keys.map((k) => (
							<Field
								key={k}
								label={k === "smtpSecure" ? "Use implicit TLS (yes / no)" : k}
								name={k}
								value={String(data[k] ?? "")}
								required={false}
								type={/secret|password/i.test(k) ? "password" : "text"}
							/>
						))}
					</Form>
				</section>
			))}
		</>
	);
}
export function Workspace({
	admin,
	section,
	id,
}: {
	admin: boolean;
	section: string;
	id: string;
}) {
	const [actor, setActor] = useState<Account | null>(null),
		[data, setData] = useState<unknown>(null),
		[error, setError] = useState(""),
		[revision, refresh] = useState(0);
	const reload = () => refresh((n) => n + 1);
	useEffect(() => {
		let live = true;
		setData(null);
		setError("");
		(async () => {
			const account = await api("account");
			if (!live) return;
			setActor(account);
			const route =
				section === "profile"
					? "account"
					: section === "users" && id
						? "users"
						: section + (id ? "/" + encodeURIComponent(id) : "");
			const result = await api(route);
			if (live) setData(result);
		})().catch((e) => {
			if (live) setError(e.message);
		});
		return () => {
			live = false;
		};
	}, [section, id, revision]);
	const save = async (f: FormData) => {
		await api(section + (id ? "/" + encodeURIComponent(id) : ""), f);
		reload();
	};
	const tabs = admin
		? adminTabs.filter((t) => actor?.permissions.includes(t[2]))
		: appTabs;
	const title = tabs.find(([k]) => k === section)?.[1] ?? section;
	function content() {
		if (error)
			return (
				<p role="alert">
					{error} · <a href="/auth/sign-in">Sign in</a>
				</p>
			);
		if (!actor || !data) return <p>Loading…</p>;
		const rows = data as Row[],
			record = data as Row,
			roles = data as RoleData;
		switch (section) {
			case "home":
			case "overview":
			case "setup":
				return (
					<div className="metrics">
						{Object.entries(record).map(([k, v]) => (
							<article className="panel" key={k}>
								<span>{k}</span>
								<strong>
									{typeof v === "boolean" ? (v ? "Ready" : "Configure") : v}
								</strong>
							</article>
						))}
					</div>
				);
			case "settings":
				return <Settings data={record} save={save} />;
			case "profile":
				return (
					<>
						<section className="panel">
							<p>
								{actor.email} ·{" "}
								{actor.emailVerified ? "Verified" : "Unverified"}
							</p>
							<p>
								Account ID <code>{actor.id}</code>
							</p>
							<Form
								submit={async (f) => {
									await auth("update-user", { name: String(f.get("name")) });
									await api("profile", f);
									reload();
								}}
							>
								<Field name="name" label="Name" value={actor.name} />
								<Field
									name="country"
									label="Country (two-letter code)"
									value={actor.country}
									required={false}
								/>
								<label>
									<input
										type="checkbox"
										name="notifications"
										defaultChecked={actor.notifications}
									/>{" "}
									Email me when support replies
								</label>
							</Form>
							{!actor.emailVerified && actor.mailConfigured && (
								<Form
									button="Send verification email"
									submit={() =>
										auth("send-verification-email", {
											email: actor.email,
											callbackURL: location.origin + "/app/profile",
										})
									}
								/>
							)}
						</section>
						<details className="panel">
							<summary>Delete account</summary>
							<Form
								button="Delete my account"
								submit={async (f) => {
									await auth("delete-user", {
										password: String(f.get("password")),
									});
									location.assign("/");
								}}
							>
								<Field
									name="password"
									type="password"
									label="Confirm your password"
								/>
							</Form>
						</details>
					</>
				);
			case "tickets":
			case "support": {
				if (!id)
					return (
						<>
							{!admin && (
								<section className="panel">
									<h2>Open a ticket</h2>
									<Form
										button="Create ticket"
										submit={async (f) => {
											const r = await api("tickets", f);
											location.assign(url(false, "tickets", r.id));
										}}
									>
										<Field name="title" label="Subject" />
										<label>
											Message
											<textarea name="message" required />
										</label>
									</Form>
								</section>
							)}
							<Records
								rows={rows}
								link={(r) => url(admin, section, String(r.id))}
							/>
						</>
					);
				const { ticket, replies } = data as { ticket: Row; replies: Row[] };
				return (
					<>
						<section className="panel">
							<h2>{ticket.title}</h2>
							<p>
								{ticket.status} · {ticket.assignee || "Unassigned"}
							</p>
							{replies.map((r, i) => (
								<blockquote key={i}>
									<strong>{r.name || "Deleted user"}</strong>
									<p>{r.message}</p>
									<small>{r.created}</small>
								</blockquote>
							))}
							<Form button="Reply" submit={save}>
								<label>
									Reply
									<textarea required name="message" />
								</label>
							</Form>
						</section>
						{admin && (
							<section className="panel">
								<Form submit={save}>
									<Field
										name="assignee"
										label="Assignee"
										value={String(ticket.assignee || "")}
										required={false}
									/>
									<label>
										Status
										<select name="status" defaultValue={String(ticket.status)}>
											<option>open</option>
											<option>waiting</option>
											<option>closed</option>
										</select>
									</label>
								</Form>
							</section>
						)}
					</>
				);
			}
			case "files":
			case "assets":
				return (
					<>
						{!admin && (
							<section className="panel">
								<Form button="Upload" submit={save}>
									<Field
										name="file"
										label="Private file, up to 8 MiB"
										type="file"
									/>
								</Form>
							</section>
						)}
						<Records
							rows={rows}
							link={(r) => "/api/core/" + section + "/" + r.id}
						/>
					</>
				);
			case "users": {
				if (!id)
					return (
						<Records
							rows={rows}
							link={(r) => url(true, "users", String(r.id))}
						/>
					);
				const user = rows.find((r) => r.id === id);
				if (!user) return <p>User not found.</p>;
				return (
					<div className="panel">
						<h2>{user.name}</h2>
						<p>{user.email}</p>
						{actor.permissions.includes("access") && (
							<Form submit={save}>
								<Field name="role" label="Role" value={String(user.role)} />
								<label>
									<input
										name="disabled"
										type="checkbox"
										defaultChecked={Boolean(user.disabled)}
									/>{" "}
									Disable account
								</label>
							</Form>
						)}
					</div>
				);
			}
			case "permissions":
			case "roles":
				return (
					<>
						<Records rows={roles.roles} />
						{section === "roles" && (
							<section className="panel">
								<h2>Save a custom role</h2>
								<Form submit={save}>
									<Field name="name" label="Role name" />
									{roles.permissions.map((p) => (
										<label key={p}>
											<input type="checkbox" name="permission" value={p} /> {p}
										</label>
									))}
								</Form>
							</section>
						)}
					</>
				);
			default:
				return <Records rows={rows} />;
		}
	}
	return (
		<div className="workspace">
			<aside>
				<b>{admin ? "Administration" : "Workspace"}</b>
				{tabs.map(([key, label]) => (
					<a
						aria-current={key === section ? "page" : undefined}
						key={key}
						href={url(admin, key)}
					>
						{label}
					</a>
				))}
				{!admin &&
					workspaceLinks
						.filter(
							(l) => !l.permission || actor?.permissions.includes(l.permission),
						)
						.map((l) => (
							<a key={l.path} href={l.path}>
								{l.label}
							</a>
						))}
				{actor?.permissions.length ? (
					<a href={admin ? "/app" : "/admin"}>
						{admin ? "My workspace" : "Administration"}
					</a>
				) : null}
			</aside>
			<section>
				<h1>{title}</h1>
				{content()}
			</section>
		</div>
	);
}
