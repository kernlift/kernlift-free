/**
 * Return paths that travel through a query string.
 *
 * A `redirectTo` value is attacker-controlled: it arrives in a URL anyone can
 * hand to anyone. Only a same-origin, site-relative path is ever returned, so
 * a crafted link cannot turn the sign-in page (or an OAuth callback derived
 * from it) into an open redirect to another host. Anything else falls back.
 */
export function toSafeRelativePath(value: unknown, fallback: string): string {
	if (typeof value !== "string") return fallback;
	const candidate = value.trim();
	if (!candidate.startsWith("/")) return fallback;
	// `//host` and `/\host` are protocol-relative: the browser reads them as
	// another origin even though they start with a slash.
	if (/^\/[/\\]/.test(candidate)) return fallback;
	// Control characters are stripped by browsers before a URL is parsed, which
	// can turn a path that looks relative into one that is not. Reject rather
	// than sanitise.
	if (hasControlCharacter(candidate)) return fallback;
	return candidate;
}

function hasControlCharacter(value: string) {
	for (const character of value) {
		const code = character.codePointAt(0) ?? 0;
		if (code < 0x20 || code === 0x7f) return true;
	}
	return false;
}

/** The current location as a return path, for a link that leads away from it. */
export function currentReturnPath(fallback = "/") {
	if (typeof window === "undefined") return fallback;
	return toSafeRelativePath(
		`${window.location.pathname}${window.location.search}`,
		fallback,
	);
}

/**
 * A return path for the sign-in and sign-up pages. On top of the relative-path
 * rule, a path back into `/auth/*` (with or without a locale prefix) falls
 * back, so a stale link cannot loop the visitor between auth screens.
 */
export function toSafeAuthReturnPath(value: unknown, fallback: string): string {
	const candidate = toSafeRelativePath(value, fallback);
	const segments = candidate.split(/[?#]/, 1)[0].split("/").filter(Boolean);
	const first = segments[0] === "zh" || segments[0] === "en" ? 1 : 0;
	return segments[first] === "auth" ? fallback : candidate;
}
