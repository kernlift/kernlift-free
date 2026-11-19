import { createFileRoute } from "@tanstack/react-router";
import { getAuth, identity } from "../../../server/auth/context";
import { appURL, settings } from "../../../server/db/repositories/core";
import { read, write } from "../../../server/db/repositories/workspace";
async function handle({ request }: { request: Request }) {
	try {
		const url = new URL(request.url);
		const [section = "", id = ""] = url.pathname
			.slice("/api/core/".length)
			.split("/");
		if (section === "providers" && request.method === "GET") {
			await getAuth();
			const s = settings(true);
			return Response.json({
				emailPassword: s.emailPassword !== "off",
				github: Boolean(s.githubId && s.githubSecret),
				google: Boolean(s.googleId && s.googleSecret),
				email: Boolean(s.smtpHost && s.mailFrom),
			});
		}
		const actor = await identity(request);
		if (!actor) return new Response("Please sign in", { status: 401 });
		if (request.method === "GET") {
			const data = await read(actor, section, id);
			return data instanceof Response
				? data
				: Response.json(data, {
						headers: { "cache-control": "private, no-store" },
					});
		}
		if (request.headers.get("origin") !== appURL)
			return new Response("Invalid origin", { status: 403 });
		// Bound the stream before multipart decoding, including requests with no Content-Length.
		const limit = 9 * 1024 * 1024;
		const reader = request.body?.getReader();
		if (!reader) return new Response("Form required", { status: 400 });
		const chunks: Uint8Array<ArrayBuffer>[] = [];
		let size = 0;
		while (true) {
			const { value, done } = await reader.read();
			if (done) break;
			size += value.length;
			if (size > limit) {
				await reader.cancel();
				return new Response("Too large", { status: 413 });
			}
			chunks.push(new Uint8Array(value));
		}
		const form = await new Response(new Blob(chunks), {
			headers: { "content-type": request.headers.get("content-type") || "" },
		}).formData();
		return Response.json(
			(await write(actor, section, id, form)) ?? { ok: true },
		);
	} catch (error) {
		if (error instanceof Response) return error;
		console.error(
			"Workspace request failed",
			error instanceof Error ? error.name : "unknown",
		);
		return new Response("Could not complete the request", { status: 500 });
	}
}
export const Route = createFileRoute("/api/core/$")({
	server: { handlers: { GET: handle, POST: handle } },
});
