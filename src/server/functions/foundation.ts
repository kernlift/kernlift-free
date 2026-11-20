import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireActor } from "../auth/guards";
import {
	providerFlags,
	settings,
	unreadableSecrets,
} from "../db/repositories/core";
import {
	fileLibrary,
	personalFile,
	personalOverview,
} from "../db/repositories/foundation";
import { users, roleSnapshot } from "../db/repositories/users-rbac.repository";
export const getHome = createServerFn().handler(async () =>
	personalOverview((await requireActor()).user.id),
);
export const getFiles = createServerFn().handler(async () =>
	fileLibrary((await requireActor()).user.id),
);
export const getFile = createServerFn()
	.validator(z.string())
	.handler(async ({ data }) =>
		personalFile((await requireActor()).user.id, data),
	);
export const getAdminFiles = createServerFn().handler(async () => {
	await requireActor("assets");
	return fileLibrary(null);
});
export const getUsers = createServerFn().handler(async () => {
	await requireActor("users");
	return users();
});
export const getUser = createServerFn()
	.validator(z.string())
	.handler(async ({ data }) => {
		const actor = await requireActor("users");
		const user = users().find((u) => u.id === data);
		if (!user) throw new Response("User not found", { status: 404 });
		return {
			user,
			roles: actor.permissions.includes("access") ? roleSnapshot().roles : [],
		};
	});
export const getSettings = createServerFn().handler(async () => {
	await requireActor("config");
	return { ...settings(), unreadable: unreadableSecrets() };
});
export const getSetup = createServerFn().handler(async () => {
	await requireActor("config");
	const s = settings(true);
	const flags = providerFlags();
	const unreadable = unreadableSecrets();
	return {
		database: true,
		// False when a stored secret was encrypted under another AUTH_SECRET; `unreadable` names them.
		secrets: unreadable.length === 0,
		unreadable,
		emailPassword: flags.emailPassword,
		requireVerification: s.requireVerification === "on",
		github: flags.github,
		google: flags.google,
		smtp: !!(s.mailFrom && s.smtpHost),
		storage: !!(
			s.endpoint &&
			s.bucketName &&
			s.accessKeyId &&
			s.secretAccessKey
		),
	};
});
export const getPreferences = createServerFn().handler(async () => {
	const a = await requireActor();
	return { country: a.country, notifications: a.notifications };
});
