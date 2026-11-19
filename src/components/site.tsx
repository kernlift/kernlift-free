import { AuthPage } from "./auth";
import { Workspace } from "./workspace";
import { auth } from "./forms";
const pages: Record<string, [string, string]> = {
	about: [
		"About",
		"Kernlift Free is an open-source starting point for a SaaS with accounts, support and a private file workspace.",
	],
	pricing: [
		"Free edition",
		"Clone the MIT-licensed starter and run it on your own infrastructure. You provide the hosting, mail and file storage.",
	],
	contact: [
		"Contact",
		"Sign in to open a support ticket. You can track the response in your workspace.",
	],
	privacy: [
		"Privacy",
		"This instance stores your account, support messages and private file metadata. Contact the site operator through a support ticket to request help with your data.",
	],
};
export function Site({ path = "" }: { path?: string }) {
	const [area, raw, id = ""] = path.replace(/^\/+|\/+$/g, "").split("/");
	const section =
		area === "admin"
			? raw || "overview"
			: raw === "assets"
				? "files"
				: raw || "home";
	const inApp = area === "admin" || area === "app";
	return (
		<>
			<header>
				<a href="/" className="brand">
					Kernlift <span>Free</span>
				</a>
				<nav>
					<a href="/about">About</a>
					<a href="/pricing">Pricing</a>
					<a href="/app">Workspace</a>
					{inApp && (
						<button
							className="quiet"
							onClick={() =>
								auth("sign-out", {}).then(() => location.assign("/"))
							}
						>
							Sign out
						</button>
					)}
				</nav>
			</header>
			<main>
				{inApp ? (
					<Workspace admin={area === "admin"} section={section} id={id} />
				) : area === "auth" ? (
					<AuthPage mode={raw || "sign-in"} />
				) : area === "system" ? (
					<section>
						<h1>Permission denied</h1>
						<a href="/app">Return to workspace</a>
					</section>
				) : pages[area] ? (
					<section className="intro">
						<h1>{pages[area][0]}</h1>
						<p>{pages[area][1]}</p>
						{area === "contact" ? (
							<a className="button" href="/app/tickets">
								Support tickets
							</a>
						) : area === "pricing" ? (
							<a
								className="button"
								href="https://github.com/kernlift/kernlift-free"
							>
								Free repository
							</a>
						) : null}
					</section>
				) : !area ? (
					<section className="intro">
						<h1>Kernlift Free</h1>
						<p>
							Your open-source SaaS starter with accounts, role-based access,
							support tickets and private files.
						</p>
						<div className="links">
							<a className="button" href="/auth/sign-up">
								Create an account
							</a>
							<a href="/auth/sign-in">Sign in</a>
						</div>
					</section>
				) : (
					<section>
						<h1>Page not found</h1>
						<a href="/">Home</a>
					</section>
				)}
			</main>
			<footer>
				<a href="/privacy">Privacy</a>
				<a href="/contact">Contact</a>
			</footer>
		</>
	);
}
