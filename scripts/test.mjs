import test from "node:test";
import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";
import { createServer } from "node:net";

test("a clean clone supports accounts, access control and the two-sided ticket workflow", async (t) => {
	const socket = createServer();
	socket.listen(0, "127.0.0.1");
	await once(socket, "listening");
	const port = socket.address().port;
	await new Promise((resolve) => socket.close(resolve));
	const origin = "http://127.0.0.1:" + port,
		dir = mkdtempSync(join(tmpdir(), "kernlift-free-"));
	const env = {
		...process.env,
		PORT: String(port),
		HOST: "127.0.0.1",
		APP_URL: origin,
		DATABASE_PATH: join(dir, "test.db"),
		AUTH_SECRET: randomBytes(32).toString("hex"),
	};
	const child = spawn(process.execPath, [".output/server/index.mjs"], {
		env,
		stdio: ["ignore", "pipe", "pipe"],
	});
	let log = "";
	child.stderr.on("data", (d) => {
		log += d;
	});
	child.stdout.resume();
	t.after(async () => {
		if (child.exitCode === null) {
			const ended = once(child, "exit");
			child.kill();
			await ended;
		}
		rmSync(dir, { recursive: true, force: true });
	});
	let ready = false;
	for (let n = 0; n < 125; n++) {
		try {
			if ((await fetch(origin + "/api/core/providers")).ok) {
				ready = true;
				break;
			}
		} catch {}
		if (child.exitCode !== null) break;
		await delay(80);
	}
	assert.ok(ready, log.slice(-1400));
	const get = (path, cookie) =>
		fetch(origin + "/api/core/" + path, {
			headers: { cookie: cookie || "" },
			redirect: "manual",
		});
	async function post(path, body, cookie = "") {
		const form = body instanceof FormData;
		return fetch(origin + path, {
			method: "POST",
			headers: {
				origin,
				cookie,
				...(form ? {} : { "content-type": "application/json" }),
			},
			body: form ? body : JSON.stringify(body),
		});
	}
	async function register(name) {
		const input = {
			name,
			email: name + "@example.test",
			password: "start-" + randomBytes(18).toString("hex"),
		};
		let res = await post("/api/auth/sign-up/email", input);
		if (res.status === 429) {
			await delay(1000 * (Number(res.headers.get("retry-after") || 10) + 1));
			res = await post("/api/auth/sign-up/email", input);
		}
		assert.equal(res.status, 200, await res.clone().text());
		return {
			id: (await res.json()).user.id,
			cookie: res.headers
				.getSetCookie()
				.map((c) => c.split(";")[0])
				.join("; "),
		};
	}
	const form = (values) => {
		const f = new FormData();
		for (const [k, v] of Object.entries(values)) f.set(k, v);
		return f;
	};
	const a = await register("owner"),
		b = await register("other"),
		staff = await register("staff");
	execFileSync(process.execPath, ["scripts/admin.mjs", staff.id], { env });
	assert.equal((await get("account")).status, 401);
	assert.equal((await get("overview", b.cookie)).status, 403);
	const created = await post(
		"/api/core/tickets",
		form({ title: "Invitation", message: "Please help" }),
		a.cookie,
	);
	assert.equal(created.status, 200, await created.clone().text());
	const { id } = await created.json();
	assert.equal((await get("tickets/" + id, b.cookie)).status, 404);
	assert.equal(
		(await post("/api/core/tickets/" + id, form({ message: "x" }), b.cookie))
			.status,
		404,
	);
	assert.equal(
		(
			await post(
				"/api/core/support/" + id,
				form({ assignee: "Support", status: "waiting" }),
				staff.cookie,
			)
		).status,
		200,
	);
	assert.equal(
		(
			await post(
				"/api/core/support/" + id,
				form({ message: "Please check your inbox." }),
				staff.cookie,
			)
		).status,
		200,
	);
	const thread = await (await get("tickets/" + id, a.cookie)).json();
	assert.equal(thread.ticket.status, "waiting");
	assert.equal(thread.replies.length, 2);
	assert.equal(
		(
			await post(
				"/api/core/profile",
				form({ country: "CN", notifications: "on" }),
				a.cookie,
			)
		).status,
		200,
	);
	assert.ok(
		(await (await get("countries", staff.cookie)).json()).some(
			(r) => r.country === "CN",
		),
	);
	assert.equal((await get("settings", a.cookie)).status, 403);
	const file = form({ file: new File(["private file"], "note.txt") });
	assert.equal((await post("/api/core/files", file, a.cookie)).status, 503);
	if (process.env.TEST_S3_ENDPOINT) {
		const config = form({
			bucketName: process.env.TEST_S3_BUCKET,
			endpoint: process.env.TEST_S3_ENDPOINT,
			region: "us-east-1",
			accessKeyId: process.env.TEST_S3_KEY,
			secretAccessKey: process.env.TEST_S3_SECRET,
		});
		assert.equal(
			(await post("/api/core/settings", config, staff.cookie)).status,
			200,
		);
		const uploaded = await post("/api/core/files", file, a.cookie);
		assert.equal(uploaded.status, 200, await uploaded.text());
		const [asset] = await (await get("files", a.cookie)).json();
		assert.equal((await get("files/" + asset.id, b.cookie)).status, 404);
		const download = await get("files/" + asset.id, a.cookie);
		assert.equal(download.status, 302);
		assert.equal(
			await (await fetch(download.headers.get("location"))).text(),
			"private file",
		);
	}
	if (process.env.TEST_MAILPIT_URL) {
		await post(
			"/api/core/settings",
			form({
				smtpHost: "127.0.0.1",
				smtpPort: process.env.TEST_SMTP_PORT,
				mailFrom: "support@example.test",
			}),
			staff.cookie,
		);
		const recipient = "verify-" + randomBytes(6).toString("hex");
		const account = await register(recipient);
		async function message(subject) {
			for (let n = 0; n < 25; n++) {
				const { messages } = await (
					await fetch(process.env.TEST_MAILPIT_URL + "/api/v1/messages")
				).json();
				const found = messages.find(
					(m) =>
						m.Subject === subject &&
						m.To.some((a) => a.Address === recipient + "@example.test"),
				);
				if (found)
					return (
						await (
							await fetch(
								process.env.TEST_MAILPIT_URL + "/api/v1/message/" + found.ID,
							)
						).json()
					).Text;
				await delay(100);
			}
			throw Error("Mail not delivered: " + subject);
		}
		const verify = (await message("Verify your email")).match(/https?:\S+/)[0];
		await fetch(verify);
		assert.equal(
			(await (await get("account", account.cookie)).json()).emailVerified,
			true,
		);
		await post("/api/auth/request-password-reset", {
			email: recipient + "@example.test",
			redirectTo: origin + "/auth/reset-password",
		});
		const link = (await message("Reset your password")).match(/https?:\S+/)[0];
		const redirect = await fetch(link, { redirect: "manual" });
		const token = new URL(
			redirect.headers.get("location"),
			origin,
		).searchParams.get("token");
		assert.ok(token);
		const password = randomBytes(18).toString("hex");
		assert.equal(
			(await post("/api/auth/reset-password", { token, newPassword: password }))
				.status,
			200,
		);
		assert.equal(
			(
				await post("/api/auth/sign-in/email", {
					email: recipient + "@example.test",
					password,
				})
			).status,
			200,
		);
	}
});
