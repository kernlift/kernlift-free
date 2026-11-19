import {
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import {
	type AuthSnapshot,
	anonymousAuthSnapshot,
	unavailableAuthSnapshot,
} from "../../lib/auth-access";
import { signOut as signOutAction } from "../../server/functions/auth";
import { getAuthSnapshot } from "../../server/functions/session-guard";
import { AuthContext, type AuthContextValue } from "./auth-state";

/**
 * Holds the display snapshot resolved by the `/admin` or `/app` layout guard.
 * Shells read it to filter navigation and render the account menu.
 */
export function AuthProvider({
	children,
	snapshot: initialSnapshot,
}: {
	children: ReactNode;
	snapshot: AuthSnapshot;
}) {
	const [snapshot, setSnapshot] = useState<AuthSnapshot>(initialSnapshot);
	const snapshotRef = useRef<AuthSnapshot>(initialSnapshot);

	const commitSnapshot = useCallback(
		(nextSnapshot: AuthSnapshot): AuthSnapshot => {
			// A dev-server module restart can interrupt one read while the tree stays
			// mounted; that transport failure is not a sign-out. Protected server
			// functions still verify every request.
			const current = snapshotRef.current;
			const resolved =
				nextSnapshot.status === "unavailable" &&
				current.status === "authenticated"
					? current
					: nextSnapshot;
			snapshotRef.current = resolved;
			setSnapshot(resolved);
			return resolved;
		},
		[],
	);

	useEffect(() => {
		commitSnapshot(initialSnapshot);
	}, [initialSnapshot, commitSnapshot]);

	async function refresh() {
		try {
			return commitSnapshot(await getAuthSnapshot());
		} catch {
			return commitSnapshot(unavailableAuthSnapshot());
		}
	}

	async function signOut() {
		await signOutAction();
		const anonymous = anonymousAuthSnapshot();
		snapshotRef.current = anonymous;
		setSnapshot(anonymous);
	}

	const value: AuthContextValue = {
		canAccessAdmin: snapshot.canAccessAdmin,
		isSignedIn: snapshot.status === "authenticated",
		refresh,
		signOut,
		snapshot,
		status: snapshot.status,
		user: snapshot.user,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
