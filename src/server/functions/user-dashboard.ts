import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireActor } from "../auth/guards";
import { registrationReport } from "../db/repositories/registrations";
export type UserDashboardTrendPoint = {
	label: string;
	today: number;
	yesterday: number;
};
export const getRegistrations = createServerFn({ method: "GET" })
	.validator(
		z.object({ days: z.union([z.literal(7), z.literal(30), z.literal(90)]) }),
	)
	.handler(async ({ data }) => {
		await requireActor("users");
		return registrationReport(data.days);
	});
