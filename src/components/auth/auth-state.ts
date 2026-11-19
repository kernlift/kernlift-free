import { createContext, useContext } from "react";
import type { AuthSnapshot } from "../../lib/auth-access";

export type AuthContextValue = {
	canAccessAdmin: boolean;
	isSignedIn: boolean;
	refresh: () => Promise<AuthSnapshot>;
	signOut: () => Promise<void>;
	snapshot: AuthSnapshot;
	status: AuthSnapshot["status"];
	user: AuthSnapshot["user"];
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
	const value = useContext(AuthContext);
	if (!value) throw new Error("useAuth must be used within AuthProvider.");
	return value;
}
