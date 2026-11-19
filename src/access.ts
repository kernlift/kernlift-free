import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { identity } from "./server/auth/context";

export const getAccess = createServerFn({ method: "GET" }).handler(async () => {
	const actor = await identity(getRequest());
	return actor ? { permissions: actor.permissions } : null;
});
