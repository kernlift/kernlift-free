import { useEffect, useState } from "react";
import { getAuthRuntimeConfig } from "../../server/functions/auth";

const googleIdentityScript = "https://accounts.google.com/gsi/client";

type GoogleIdentity = {
	accounts?: {
		id?: {
			initialize: (options: {
				client_id: string;
				callback: (response: { credential?: string }) => void;
				cancel_on_tap_outside?: boolean;
				context?: "signin" | "signup" | "use";
				use_fedcm_for_prompt?: boolean;
			}) => void;
			prompt: () => void;
			cancel: () => void;
		};
	};
};

declare global {
	interface Window {
		google?: GoogleIdentity;
	}
}

let scriptLoad: Promise<void> | null = null;

function loadGoogleIdentity() {
	scriptLoad ??= new Promise<void>((resolve, reject) => {
		const script = document.createElement("script");
		script.src = googleIdentityScript;
		script.async = true;
		script.defer = true;
		script.onload = () => resolve();
		script.onerror = () => {
			scriptLoad = null;
			reject(new Error("Google Identity Services did not load."));
		};
		document.head.appendChild(script);
	});
	return scriptLoad;
}

/**
 * Google One Tap on the sign-in and sign-up pages. Renders nothing itself: Google draws the prompt.
 * The ID token goes to Better Auth's `/api/auth/one-tap/callback`, which verifies it against the
 * configured Google client and sets the session cookie. The client ID arrives only while One Tap is
 * on in Administration → Auth Config and Google sign-in is configured.
 */
export function GoogleOneTap({ redirectTo }: { redirectTo: string }) {
	const [clientId, setClientId] = useState<string | null>(null);

	useEffect(() => {
		let alive = true;
		getAuthRuntimeConfig()
			.then((config) => {
				if (alive) setClientId(config.googleOneTapClientId);
			})
			.catch(() => {
				if (alive) setClientId(null);
			});
		return () => {
			alive = false;
		};
	}, []);

	useEffect(() => {
		if (!clientId) return;
		let cancelled = false;
		loadGoogleIdentity()
			.then(() => {
				const identity = window.google?.accounts?.id;
				if (cancelled || !identity) return;
				identity.initialize({
					client_id: clientId,
					cancel_on_tap_outside: true,
					context: "signin",
					use_fedcm_for_prompt: true,
					callback: async ({ credential }) => {
						if (!credential) return;
						const response = await fetch("/api/auth/one-tap/callback", {
							method: "POST",
							credentials: "same-origin",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({ idToken: credential }),
						});
						// On failure the form and its Google button stay available.
						if (response.ok) window.location.href = redirectTo;
					},
				});
				identity.prompt();
			})
			.catch(() => {
				// Blocked by an extension or offline: the Google button on the form still works.
			});
		return () => {
			cancelled = true;
			window.google?.accounts?.id?.cancel();
		};
	}, [clientId, redirectTo]);

	return null;
}
