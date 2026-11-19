import { getRequest } from "@tanstack/react-start/server";
import { identity } from "./context";
export async function requireActor(permission?: string) {
	const actor = await identity(getRequest());
	if (
		!actor ||
		(permission && !actor.permissions.some((key) => key === permission))
	)
		throw new Error("Permission denied");
	return actor;
}
