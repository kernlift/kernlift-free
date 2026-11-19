import { uiIcon } from "@/beui/foundation";
import { CircleAlert, CircleCheck } from "lucide-react";
import { authPagesMessages } from "../../i18n/auth-pages";
import { createTranslator, type Locale } from "../../i18n/messages";

/** Translate the observed provider response without changing authentication decisions. */
export function authErrorMessage(error: unknown, locale: Locale) {
	const message = error instanceof Error ? error.message : "";
	if (/^invalid email or password\.?$/i.test(message.trim())) {
		return authPagesMessages[locale].invalidCredentials;
	}
	// Preserve application-specific recovery messages, including verification and bans.
	return message || createTranslator(locale)("auth.form.failed");
}

export function AuthFeedback({
	message,
	error,
}: {
	message: string;
	error: boolean;
}) {
	if (!message) return null;
	const Icon = error ? CircleAlert : CircleCheck;
	return (
		<p
			className={`flex items-start gap-2 text-sm leading-relaxed ${error ? "text-destructive" : "text-muted-foreground"}`}
			role={error ? "alert" : "status"}
		>
			<Icon {...uiIcon.inline} className="mt-0.5 shrink-0" aria-hidden="true" />
			<span>{message}</span>
		</p>
	);
}
