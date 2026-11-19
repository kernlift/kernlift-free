/**
 * Display-only view of the caller's session, shared by the admin and workspace
 * shells. It is built on the server by `src/server/functions/session-guard.ts`
 * from `getAuthContext()`; it never grants access by itself. Every protected
 * server function still checks identity and permissions on its own.
 */
export type AuthUser = Readonly<{
	id: string;
	email: string;
	emailVerified: boolean;
	name: string;
	image: string | null;
}>;

export type AuthSnapshot =
	| Readonly<{
			status: "anonymous";
			user: null;
			canAccessAdmin: false;
	  }>
	| Readonly<{
			status: "authenticated";
			user: AuthUser;
			canAccessAdmin: boolean;
			permissions: readonly string[];
	  }>
	| Readonly<{
			status: "blocked";
			user: AuthUser;
			canAccessAdmin: false;
	  }>
	| Readonly<{
			status: "unavailable";
			user: null;
			canAccessAdmin: false;
	  }>;

export function anonymousAuthSnapshot(): AuthSnapshot {
	return Object.freeze({
		status: "anonymous",
		user: null,
		canAccessAdmin: false,
	});
}

export function unavailableAuthSnapshot(): AuthSnapshot {
	return Object.freeze({
		status: "unavailable",
		user: null,
		canAccessAdmin: false,
	});
}

export function snapshotPermissions(snapshot: AuthSnapshot): readonly string[] {
	return snapshot.status === "authenticated" ? snapshot.permissions : [];
}
