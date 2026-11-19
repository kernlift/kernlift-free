import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { identity } from "../auth/context";
import {
	anonymousAuthSnapshot,
	type AuthSnapshot,
} from "../../lib/auth-access";
export const getAuthSnapshot = createServerFn({ method: "GET" }).handler(
	async (): Promise<AuthSnapshot> => {
		const actor = await identity(getRequest());
		if (!actor) return anonymousAuthSnapshot();
		const permissions: string[] = [...actor.permissions];
		if (permissions.includes("support")) permissions.push("support.write");
		if (permissions.includes("access"))
			permissions.push("roles.write", "users.write");
		return {
			status: "authenticated",
			permissions,
			canAccessAdmin: actor.permissions.length > 0,
			user: {
				id: actor.user.id,
				name: actor.user.name,
				email: actor.user.email,
				emailVerified: actor.user.emailVerified,
				image: actor.user.image ?? null,
			},
		};
	},
);
