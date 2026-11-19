import { betterAuth } from "better-auth";
import { getMigrations } from "better-auth/db/migration";
import { APIError } from "better-auth/api";
import { createTransport } from "nodemailer";
import { access, appURL, db, secret, settings } from "../db/repositories/core";

export async function sendMail(to: string, subject: string, url: string) {
	const s = settings(true);
	if (!s.smtpHost || !s.mailFrom)
		throw new Error("Configure SMTP in Admin settings first.");
	const transport = createTransport({
		host: s.smtpHost,
		port: Number(s.smtpPort || 587),
		secure: s.smtpSecure === "yes",
		auth: s.smtpUser ? { user: s.smtpUser, pass: s.smtpPassword } : undefined,
	});
	await transport.sendMail({
		from: s.mailFrom,
		to,
		subject,
		text: subject + "\n\n" + url,
	});
}
let migration: Promise<void> | undefined;
export async function getAuth() {
	if (secret.length < 32) throw new Error("Run pnpm setup or set AUTH_SECRET.");
	const s = settings(true);
	const auth = betterAuth({
		baseURL: appURL,
		secret,
		database: db,
		socialProviders: {
			...(s.githubId && s.githubSecret
				? { github: { clientId: s.githubId, clientSecret: s.githubSecret } }
				: {}),
			...(s.googleId && s.googleSecret
				? { google: { clientId: s.googleId, clientSecret: s.googleSecret } }
				: {}),
		},
		emailAndPassword: {
			enabled: true,
			minPasswordLength: 10,
			sendResetPassword: ({ user, url }) =>
				sendMail(user.email, "Reset your password", url),
		},
		emailVerification: {
			sendOnSignUp: Boolean(s.smtpHost && s.mailFrom),
			sendVerificationEmail: ({ user, url }) =>
				sendMail(user.email, "Verify your email", url),
		},
		user: { deleteUser: { enabled: true } },
		rateLimit: { enabled: true, storage: "database" },
		databaseHooks: {
			session: {
				create: {
					before: async (session) => {
						if (access(session.userId).disabled)
							throw new APIError("FORBIDDEN", { message: "Account disabled" });
					},
				},
			},
		},
	});
	migration ??= getMigrations(auth.options)
		.then((m) => m.runMigrations())
		.catch((error) => {
			migration = undefined;
			throw error;
		});
	await migration;
	return auth;
}
export async function identity(request: Request) {
	const auth = await getAuth();
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) return null;
	const profile = access(session.user.id);
	if (profile.disabled) throw new Response("Account disabled", { status: 403 });
	return { user: session.user, ...profile };
}
