import assert from "node:assert/strict";
import { createCipheriv, randomBytes } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

// Each validator file runs in its own process, so the database and secret are this test's own.
const dir = mkdtempSync(join(tmpdir(), "kernlift-providers-"));
process.env.DATABASE_PATH = join(dir, "providers.db");
process.env.AUTH_SECRET = randomBytes(32).toString("hex");
process.env.APP_URL = "http://localhost:5173";
const { getAuth } = await import("../../src/server/auth/context.ts");
const core = await import("../../src/server/db/repositories/core.ts");
const { db, providerFlags, saveSettings, settings, unreadableSecrets } = core;
test.after(() => {
	db.close();
	rmSync(dir, { recursive: true, force: true });
});

const googleId = "validate-one-tap.apps.googleusercontent.com";
function save(values) {
	const form = new FormData();
	for (const [key, value] of Object.entries(values)) form.set(key, value);
	saveSettings(form, "validate");
}
const stored = (key) =>
	db.prepare("SELECT value FROM setting WHERE key=?").get(key)?.value;
/** A value encrypted the same way but under another AUTH_SECRET. */
function foreignCiphertext(plaintext) {
	const iv = randomBytes(12);
	const cipher = createCipheriv("aes-256-gcm", randomBytes(32), iv);
	const data = Buffer.concat([cipher.update(plaintext), cipher.final()]);
	return [iv, cipher.getAuthTag(), data].map((b) => b.toString("hex")).join(".");
}
async function oneTapCallback() {
	const auth = await getAuth();
	const response = await auth.handler(
		new Request("http://localhost:5173/api/auth/one-tap/callback", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Origin: "http://localhost:5173",
			},
			body: JSON.stringify({ idToken: "not-a-google-id-token" }),
		}),
	);
	const body = await response.json().catch(() => ({}));
	return { status: response.status, message: String(body.message ?? "") };
}

test("an undecryptable provider secret reads as unset instead of breaking sign-in", async () => {
	save({
		emailPassword: "on",
		googleId,
		googleSecret: "google-secret",
		githubId: "github-id",
		githubSecret: "github-secret",
	});
	const auth = await getAuth();
	const password = randomBytes(16).toString("hex");
	await auth.api.signUpEmail({
		body: { name: "operator", email: "operator@example.test", password },
	});

	// The Google secret was written under another AUTH_SECRET; the SMTP password was never encrypted.
	db.prepare("UPDATE setting SET value=? WHERE key='googleSecret'").run(
		foreignCiphertext("google-secret"),
	);
	db.prepare("INSERT INTO setting VALUES ('smtpPassword','legacy-plain')").run();
	assert.equal(settings(true).googleSecret, "");
	assert.equal(settings(true).githubSecret, "github-secret");
	assert.deepEqual(new Set(unreadableSecrets()), new Set(["googleSecret", "smtpPassword"]));
	assert.equal(providerFlags().google, false);
	assert.equal(providerFlags().github, true);
	const signedIn = await (await getAuth()).api.signInEmail({
		body: { email: "operator@example.test", password },
	});
	assert.ok(signedIn.token, "email sign-in keeps working");

	// A blank field keeps the unreadable value; entering it again repairs it.
	const before = stored("googleSecret");
	save({ googleId, googleSecret: "" });
	assert.equal(stored("googleSecret"), before);
	save({ googleId, googleSecret: "google-secret-2" });
	assert.equal(settings(true).googleSecret, "google-secret-2");
	assert.deepEqual(unreadableSecrets(), ["smtpPassword"]);
});

test("password sign-in stays on when no social provider can be read", async () => {
	save({ emailPassword: "off" });
	assert.equal(providerFlags().emailPassword, false);
	db.prepare(
		"UPDATE setting SET value=? WHERE key IN ('googleSecret','githubSecret')",
	).run(foreignCiphertext("x"));
	assert.equal(providerFlags().emailPassword, true);
	assert.equal((await getAuth()).options.emailAndPassword.enabled, true);
	save({ emailPassword: "on", googleSecret: "google-secret", githubSecret: "github-secret" });
});

test("Google One Tap follows its switch and verifies tokens against the Google client", async () => {
	save({ googleOneTap: "on" });
	assert.equal(providerFlags().googleOneTapClientId, googleId);
	const forged = await oneTapCallback();
	assert.equal(forged.status, 400, forged.message);
	assert.match(forged.message, /invalid id token/i);

	save({ googleOneTap: "off" });
	assert.equal(providerFlags().googleOneTapClientId, null);
	assert.equal((await oneTapCallback()).status, 404);

	// Switched on without readable Google credentials: nothing is exposed.
	save({ googleOneTap: "on" });
	db.prepare("UPDATE setting SET value=? WHERE key='googleSecret'").run(
		foreignCiphertext("x"),
	);
	assert.equal(providerFlags().googleOneTapClientId, null);
	assert.equal((await oneTapCallback()).status, 404);
});

test("the pages are wired to the provider flags", () => {
	const route = readFileSync("src/routes/api/core/$.ts", "utf8");
	const page = readFileSync("src/components/auth/auth-page.tsx", "utf8");
	const prompt = readFileSync("src/components/auth/google-one-tap.tsx", "utf8");
	const runtime = readFileSync("src/server/functions/auth.ts", "utf8");
	const console = readFileSync("src/components/settings/provider-settings.tsx", "utf8");
	const setup = readFileSync("src/server/functions/foundation.ts", "utf8");
	assert.match(route, /Response\.json\(providerFlags\(\)\)/);
	assert.match(page, /<GoogleOneTap redirectTo=\{returnPath\} \/>/);
	assert.match(prompt, /fetch\("\/api\/auth\/one-tap\/callback"/);
	assert.match(runtime, /googleOneTapClientId: \(config\.googleOneTapClientId/);
	assert.match(console, /name="googleOneTap"/);
	assert.match(console, /data\.unreadable/);
	assert.match(setup, /secrets: unreadable\.length === 0/);
});
