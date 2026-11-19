import { api, auth } from "../../components/forms";
import { localizedPath, normalizeLocale } from "@/i18n/messages";
import { toSafeRelativePath } from "@/lib/safe-redirect";
type Input<T> = { data: T };
type EmailInput = { email: string; password: string; locale: string };
export function signOut() {
	return auth("sign-out", {});
}
export async function getAuthRuntimeConfig() {
	const config = await api("providers");
	return {
		providers: [
			{ id: "email", type: "email", enabled: config.emailPassword },
			...(["google", "github"] as const).map((id) => ({
				id,
				type: "oauth",
				enabled: !!config[id],
			})),
		],
	};
}
export async function signUpWithEmail({
	data: { locale, ...credentials },
}: Input<EmailInput & { name: string }>) {
	const config = await api("providers");
	await auth("sign-up/email", {
		...credentials,
		callbackURL: localizedPath("/app", normalizeLocale(locale)),
	});
	return Boolean(config.email);
}
export function signInWithEmail({
	data: { email, password },
}: Input<EmailInput>) {
	return auth("sign-in/email", { email, password });
}
export async function requestPasswordReset({
	data: { email },
}: Input<{ email: string }>) {
	if (!(await api("providers")).email)
		throw new Error(
			document.documentElement.lang.startsWith("zh")
				? "本站尚未配置邮件服务。"
				: "Email delivery is not configured.",
		);
	return auth("request-password-reset", {
		email,
		redirectTo:
			location.origin +
			location.pathname.replace(/forgot-password$/, "reset-password"),
	});
}
export function resetPassword({
	data,
}: Input<{ token: string; newPassword: string }>) {
	return auth("reset-password", data);
}
export async function signInWithProvider({
	data,
}: Input<{ provider: string; locale: string; redirectTo?: string }>) {
	const result = await auth("sign-in/social", {
		provider: data.provider,
		callbackURL: toSafeRelativePath(
			data.redirectTo,
			localizedPath("/app", normalizeLocale(data.locale)),
		),
		disableRedirect: true,
	});
	return {
		ok: !!result.url,
		url: result.url as string | undefined,
		message: result.message as string | undefined,
	};
}
export async function verifyEmailToken({ data }: Input<{ token: string }>) {
	const res = await fetch(
		"/api/auth/verify-email?" + new URLSearchParams(data),
	);
	return { status: res.ok ? ("verified" as const) : ("invalid" as const) };
}
export async function updateCurrentUserProfile({
	data,
}: Input<{ name: string }>) {
	await auth("update-user", data);
	return api("account");
}
export async function resendCurrentUserVerificationEmail({
	data,
}: Input<{ locale: string }>) {
	const account = await api("account");
	if (account.emailVerified) return { status: "already_verified" };
	if (!account.mailConfigured) return { status: "not_configured" };
	await auth("send-verification-email", {
		email: account.email,
		callbackURL: localizedPath("/app/profile", normalizeLocale(data.locale)),
	});
	return { status: "sent" };
}
export function deleteCurrentUser() {
	return auth("delete-user", {});
}
