import { useState, type ReactNode } from "react";
export function Form({
	children,
	submit,
	button = "Save",
}: {
	children?: ReactNode;
	submit: (data: FormData) => Promise<unknown>;
	button?: string;
}) {
	const [status, setStatus] = useState(""),
		[busy, setBusy] = useState(false);
	return (
		<form
			onSubmit={async (e) => {
				e.preventDefault();
				if (busy) return;
				const form = e.currentTarget;
				setBusy(true);
				setStatus("");
				try {
					await submit(new FormData(form));
					setStatus("Saved.");
				} catch (e) {
					setStatus(e instanceof Error ? e.message : "Could not save.");
				} finally {
					setBusy(false);
				}
			}}
		>
			{children}
			<button disabled={busy}>{busy ? "Working…" : button}</button>
			{status && <output role="status">{status}</output>}
		</form>
	);
}
export async function api(path: string, form?: FormData) {
	const res = await fetch(
		"/api/core/" + path,
		form ? { method: "POST", body: form } : {},
	);
	if (!res.ok) throw new Error(await res.text());
	return res.json();
}
export async function auth(path: string, data: Record<string, unknown>) {
	const res = await fetch("/api/auth/" + path, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(data),
	});
	const body = await res.json();
	if (!res.ok)
		throw new Error(body.message || "Could not finish authentication.");
	return body;
}
export function Field({
	name,
	label,
	type = "text",
	value,
	required = true,
}: {
	name: string;
	label: string;
	type?: string;
	value?: string;
	required?: boolean;
}) {
	return (
		<label>
			{label}
			<input name={name} type={type} defaultValue={value} required={required} />
		</label>
	);
}
