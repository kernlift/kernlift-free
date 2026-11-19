import { useEffect, useState } from "react";
import { api, auth, Field, Form } from "./forms";
const titles: Record<string, string> = {
	"sign-in": "Sign in",
	"sign-up": "Create account",
	"forgot-password": "Reset password",
	"reset-password": "Choose a new password",
};
export function AuthPage({ mode }: { mode: string }) {
	const [providers, setProviders] = useState({
		google: false,
		github: false,
		email: false,
	});
	const [notice, setNotice] = useState("");
	useEffect(() => {
		api("providers")
			.then(setProviders)
			.catch((e) => setNotice(e.message));
	}, []);
	return (
		<section className="panel narrow">
			<h1>{titles[mode] || "Account"}</h1>
			<Form
				button={titles[mode]}
				submit={async (f) => {
					const email = String(f.get("email") || ""),
						password = String(f.get("password") || "");
					if (mode === "forgot-password") {
						if (!providers.email)
							throw Error("Email delivery has not been configured.");
						await auth("request-password-reset", {
							email,
							redirectTo: location.origin + "/auth/reset-password",
						});
						setNotice("Check your inbox for a reset link.");
					} else if (mode === "reset-password") {
						await auth("reset-password", {
							newPassword: password,
							token: new URLSearchParams(location.search).get("token"),
						});
						location.assign("/auth/sign-in");
					} else {
						await auth(mode === "sign-in" ? "sign-in/email" : "sign-up/email", {
							email,
							password,
							name: String(f.get("name") || ""),
						});
						location.assign("/app");
					}
				}}
			>
				{mode === "sign-up" && <Field name="name" label="Name" />}
				{mode !== "reset-password" && (
					<Field name="email" type="email" label="Email" />
				)}
				{mode !== "forgot-password" && (
					<Field
						name="password"
						type="password"
						label="Password (10 or more characters)"
					/>
				)}
			</Form>
			{mode === "sign-in" &&
				(["google", "github"] as const).map(
					(p) =>
						providers[p] && (
							<button
								key={p}
								onClick={() =>
									auth("sign-in/social", {
										provider: p,
										callbackURL: location.origin + "/app",
									})
										.then((v) => location.assign(v.url))
										.catch((e) => setNotice(e.message))
								}
							>
								Continue with {p}
							</button>
						),
				)}
			<p>{notice}</p>
			<div className="links">
				<a href="/auth/sign-in">Sign in</a>
				<a href="/auth/sign-up">Register</a>
				<a href="/auth/forgot-password">Forgot password?</a>
			</div>
		</section>
	);
}
