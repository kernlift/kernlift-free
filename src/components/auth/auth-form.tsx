import { uiIcon } from "@/beui/foundation";
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

import { Button, StatefulButton } from "@/components/motion/button";
import { Input } from "@/components/motion/input";
import { TextLink } from "@/components/motion/text-link";
import { cn } from "@/lib/utils";
import { siteConfig } from "../../config/site";
import { authPagesMessages } from "../../i18n/auth-pages";
import {
	createTranslator,
	type Locale,
	localizedPath,
} from "../../i18n/messages";
import { toSafeRelativePath } from "../../lib/safe-redirect";
import {
	getAuthRuntimeConfig,
	requestPasswordReset,
	resetPassword,
	signInWithEmail,
	signInWithProvider,
	signUpWithEmail,
} from "../../server/functions/auth";
import { AuthFeedback, authErrorMessage } from "./auth-feedback";

type AuthFormProps = {
	mode: "sign-in" | "sign-up" | "forgot-password" | "reset-password";
	title?: string;
	description?: string;
	submitLabel?: string;
	locale?: Locale;
	onAuthenticated?: () => void | Promise<void>;
	redirectTo?: string;
	socialFirst?: boolean;
	showForgotPassword?: boolean;
	/** Set false when the host renders `SocialSignInButtons` itself. */
	showSocialProviders?: boolean;
};

type RuntimeProvider = Awaited<
	ReturnType<typeof getAuthRuntimeConfig>
>["providers"][number];

export function AuthForm({
	mode,
	title,
	description,
	submitLabel,
	locale = "en",
	onAuthenticated,
	redirectTo = siteConfig.signedInHome,
	socialFirst = false,
	showForgotPassword = false,
	showSocialProviders: allowSocialProviders = true,
}: AuthFormProps) {
	const t = createTranslator(locale);
	const copy = authPagesMessages[locale];
	// The caller may pass a return path that came out of a query string; a
	// non-relative one is replaced rather than followed.
	const safeRedirectTo = toSafeRelativePath(
		redirectTo,
		localizedPath(siteConfig.signedInHome, locale),
	);
	const actionLabel = submitLabel ?? title ?? copy.submit;
	const [message, setMessage] = useState("");
	const [messageIsError, setMessageIsError] = useState(false);
	const [pending, setPending] = useState(false);
	const [passwordVisible, setPasswordVisible] = useState(false);

	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	function validateField(input: HTMLInputElement) {
		const error = input.validity.valueMissing
			? copy.requiredField
			: input.validity.typeMismatch
				? copy.invalidEmail
				: input.validity.tooShort
					? copy.passwordTooShort
					: "";
		setFieldErrors((current) => ({ ...current, [input.name]: error }));
	}
	const providers = useAuthProviders();

	async function onSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setPending(true);
		setMessage("");

		try {
			const result = await runAuthAction(
				mode,
				new FormData(event.currentTarget),
			);
			setMessageIsError(false);
			// Successful sign-in redirects immediately, so a completion notice would only flash
			// before navigation. Sign-up asks the visitor to verify; the password reset steps
			// confirm that the request went through.
			setMessage(
				mode === "sign-up" && result
					? t("auth.form.verificationSent")
					: mode === "sign-in"
						? ""
						: t("auth.form.completed"),
			);

			if (mode === "sign-in" || (mode === "sign-up" && !result)) {
				if (onAuthenticated) {
					await onAuthenticated();
				} else {
					window.location.href = safeRedirectTo;
				}
			}
		} catch (error) {
			const message =
				error instanceof Error ? error.message : t("auth.form.failed");
			// The sign-in rate limit (S13) has its own recovery page.
			if (mode === "sign-in" && message.includes("S13")) {
				window.location.href = localizedPath("/system/rate-limited", locale);
				return;
			}

			setMessageIsError(true);
			setMessage(authErrorMessage(error, locale));
		} finally {
			setPending(false);
		}
	}

	const emailProvider = providers.find((provider) => provider.id === "email");
	const socialProviders = selectSocialProviders(providers);
	const emailEnabled = emailProvider?.enabled ?? true;
	const showSocialProviders =
		allowSocialProviders &&
		(mode === "sign-in" || mode === "sign-up") &&
		socialProviders.length > 0;

	const socialButtons = showSocialProviders ? (
		<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 has-[>button:only-child]:grid-cols-1">
			<SocialSignInButtons
				compactLabels
				locale={locale}
				providers={socialProviders}
				redirectTo={safeRedirectTo}
				onMessage={(message) => {
					setMessageIsError(true);
					setMessage(message);
				}}
			/>
		</div>
	) : null;

	const divider =
		showSocialProviders && emailEnabled ? (
			<div className="flex items-center gap-3 text-xs text-muted-foreground">
				<span className="h-px flex-1 bg-border" aria-hidden="true" />
				{copy.continueWithEmail}
				<span className="h-px flex-1 bg-border" aria-hidden="true" />
			</div>
		) : null;

	const field = (name: string) => ({
		disabled: pending,
		error: fieldErrors[name],
		onBlur: (event: React.FocusEvent<HTMLInputElement>) =>
			validateField(event.currentTarget),
		onChange: () => setFieldErrors((current) => ({ ...current, [name]: "" })),
		classNames: {
			label: "px-0 text-sm font-medium",
			field: "rounded-lg bg-background",
		},
	});

	return (
		<form
			className="flex w-full flex-col gap-5"
			data-mode={mode}
			onSubmit={onSubmit}
		>
			{title || description ? (
				<div className="flex flex-col gap-2">
					{title ? (
						<h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
					) : null}
					{description ? (
						<p className="text-sm text-muted-foreground">{description}</p>
					) : null}
				</div>
			) : null}
			{socialFirst ? socialButtons : null}
			{socialFirst ? divider : null}
			<input name="locale" type="hidden" value={locale} />
			{mode === "sign-up" && emailEnabled ? (
				<Input
					{...field("name")}
					id={`${mode}-name`}
					name="name"
					autoComplete="name"
					label={t("auth.form.name")}
					placeholder={t("auth.form.namePlaceholder")}
					leftIcon={<UserRound {...uiIcon.inline} aria-hidden="true" />}
					required
				/>
			) : null}
			{mode !== "reset-password" && emailEnabled ? (
				<Input
					{...field("email")}
					id={`${mode}-email`}
					name="email"
					autoComplete="email"
					type="email"
					label={t("auth.form.email")}
					placeholder={t("auth.form.emailPlaceholder")}
					leftIcon={<Mail {...uiIcon.inline} aria-hidden="true" />}
					required
				/>
			) : null}
			{(mode === "sign-in" || mode === "sign-up") && emailEnabled ? (
				<Input
					{...field("password")}
					id={`${mode}-password`}
					name="password"
					autoComplete={
						mode === "sign-in" ? "current-password" : "new-password"
					}
					type={passwordVisible ? "text" : "password"}
					minLength={10}
					aria-describedby={
						mode === "sign-up" ? "sign-up-password-hint" : undefined
					}
					required
					label={t("auth.form.password")}
					placeholder={t("auth.form.passwordPlaceholder")}
					leftIcon={<LockKeyhole {...uiIcon.inline} aria-hidden="true" />}
					rightIcon={
						<Button
							data-password-toggle
							aria-label={
								passwordVisible ? copy.hidePassword : copy.showPassword
							}
							aria-pressed={passwordVisible}
							disabled={pending}
							onClick={() => setPasswordVisible((visible) => !visible)}
							size="icon"
							type="button"
							variant="ghost"
						>
							{passwordVisible ? (
								<EyeOff {...uiIcon.inline} aria-hidden="true" />
							) : (
								<Eye {...uiIcon.inline} aria-hidden="true" />
							)}
						</Button>
					}
				/>
			) : null}
			{mode === "sign-up" && emailEnabled ? (
				<p
					id="sign-up-password-hint"
					className="-mt-3 mb-0 text-xs leading-5 text-muted-foreground"
				>
					{copy.passwordHint}
				</p>
			) : null}
			{mode === "sign-in" && showForgotPassword && emailEnabled ? (
				<TextLink
					className="self-end text-xs text-muted-foreground underline-offset-4 hover:underline"
					href={localizedPath("/auth/forgot-password", locale)}
				>
					{t("auth.signIn.forgotPassword")}
				</TextLink>
			) : null}
			{mode === "reset-password" ? (
				<>
					<Input
						{...field("token")}
						id="reset-token"
						name="token"
						defaultValue={
							typeof window === "undefined"
								? ""
								: (new URLSearchParams(window.location.search).get("token") ??
									"")
						}
						label={t("auth.form.resetToken")}
						placeholder={t("auth.form.tokenPlaceholder")}
						required
					/>
					<Input
						{...field("newPassword")}
						id="reset-new-password"
						name="newPassword"
						autoComplete="new-password"
						label={t("auth.form.newPassword")}
						type="password"
						minLength={10}
						required
					/>
				</>
			) : null}
			{emailEnabled ? (
				<StatefulButton
					className="w-full rounded-lg"
					data-auth-submit
					aria-label={pending ? t("auth.form.pending") : actionLabel}
					disabled={pending}
					state={pending ? "loading" : "idle"}
					loadingText={t("auth.form.pending")}
					type="submit"
				>
					{actionLabel}
				</StatefulButton>
			) : null}
			{!socialFirst ? divider : null}
			{!socialFirst ? socialButtons : null}
			<AuthFeedback message={message} error={messageIsError} />
		</form>
	);
}

export type SocialProvider = RuntimeProvider & { id: "google" | "github" };

/** Runtime auth providers, loaded once per mount; empty until the config resolves. */
export function useAuthProviders() {
	const [providers, setProviders] = useState<RuntimeProvider[]>([]);

	useEffect(() => {
		let alive = true;
		getAuthRuntimeConfig()
			.then((config) => {
				if (alive) setProviders(config.providers);
			})
			.catch(() => {
				if (alive) setProviders([]);
			});
		return () => {
			alive = false;
		};
	}, []);

	return providers;
}

export function selectSocialProviders(providers: RuntimeProvider[]) {
	return providers.filter(
		(provider) => provider.type === "oauth" && provider.enabled,
	) as SocialProvider[];
}

export function SocialSignInButtons({
	className,
	compactLabels = false,
	locale = "en",
	onMessage,
	providers,
	redirectTo,
}: {
	className?: string;
	compactLabels?: boolean;
	locale?: Locale;
	onMessage?: (message: string) => void;
	providers: SocialProvider[];
	redirectTo: string;
}) {
	const t = createTranslator(locale);
	const copy = authPagesMessages[locale];
	const [socialPending, setSocialPending] = useState("");

	async function onSocialSignIn(provider: SocialProvider["id"]) {
		setSocialPending(provider);
		onMessage?.("");

		try {
			const result = await signInWithProvider({
				data: {
					provider,
					locale,
					redirectTo,
				},
			});

			if (result.ok && result.url) {
				window.location.href = result.url;
				return;
			}

			onMessage?.(result.message ?? t("auth.form.providerNotConfigured"));
		} catch (error) {
			onMessage?.(
				error instanceof Error ? error.message : t("auth.form.failed"),
			);
		} finally {
			setSocialPending("");
		}
	}

	return (
		<>
			{providers.map((provider) => (
				<Button
					className={cn("h-11 w-full justify-center gap-2.5", className)}
					data-auth-provider={provider.id}
					disabled={Boolean(socialPending)}
					key={provider.id}
					onClick={() => onSocialSignIn(provider.id)}
					type="button"
					variant="outline"
				>
					<ProviderIcon providerId={provider.id} />
					{socialPending === provider.id
						? `${t("auth.form.openingPrefix")} ${providerDisplayName(provider.id)}...`
						: compactLabels
							? providerDisplayName(provider.id)
							: socialButtonLabel(
									providerDisplayName(provider.id),
									t("auth.form.continueWithPrefix"),
									copy.continueWithSuffix,
								)}
				</Button>
			))}
		</>
	);
}

function runAuthAction(mode: AuthFormProps["mode"], form: FormData) {
	const locale = String(form.get("locale") ?? "en");

	if (mode === "sign-up") {
		return signUpWithEmail({
			data: {
				name: String(form.get("name") ?? ""),
				email: String(form.get("email") ?? ""),
				password: String(form.get("password") ?? ""),
				locale,
			},
		});
	}

	if (mode === "sign-in") {
		return signInWithEmail({
			data: {
				email: String(form.get("email") ?? ""),
				password: String(form.get("password") ?? ""),
				locale,
			},
		});
	}

	if (mode === "forgot-password") {
		return requestPasswordReset({
			data: {
				email: String(form.get("email") ?? ""),
			},
		});
	}

	return resetPassword({
		data: {
			token: String(form.get("token") ?? ""),
			newPassword: String(form.get("newPassword") ?? ""),
		},
	});
}

function socialButtonLabel(provider: string, prefix: string, suffix: string) {
	return [prefix, provider, suffix].filter(Boolean).join(" ");
}

/** Brand names are not translated; the sentence around them is. */
function providerDisplayName(providerId: "google" | "github") {
	return providerId === "github" ? "GitHub" : "Google";
}

function ProviderIcon({ providerId }: { providerId: "google" | "github" }) {
	if (providerId === "github") {
		return (
			<svg aria-hidden="true" className="size-4" viewBox="0 0 24 24">
				<path
					d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.88c-2.78.6-3.37-1.18-3.37-1.18-.45-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.35 1.09 2.92.83.09-.65.35-1.09.64-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.6 9.6 0 0 1 12 6.82a9.6 9.6 0 0 1 2.5.34c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.56 4.94.36.31.68.92.68 1.85v2.76c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"
					fill="currentColor"
				/>
			</svg>
		);
	}

	return (
		<svg aria-hidden="true" className="size-4" viewBox="0 0 24 24">
			<path
				d="M21.6 12.23c0-.68-.06-1.33-.17-1.96H12v3.7h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.74 2.98-4.31 2.98-7.26Z"
				fill="#4285F4"
			/>
			<path
				d="M12 21.6c2.7 0 4.96-.9 6.62-2.42l-3.24-2.5c-.9.6-2.04.95-3.38.95-2.6 0-4.8-1.75-5.59-4.11H3.06v2.58A10 10 0 0 0 12 21.6Z"
				fill="#34A853"
			/>
			<path
				d="M6.41 13.52A6 6 0 0 1 6.1 11.6c0-.67.11-1.31.31-1.92V7.1H3.06A10 10 0 0 0 2 11.6c0 1.62.39 3.15 1.06 4.5l3.35-2.58Z"
				fill="#FBBC05"
			/>
			<path
				d="M12 5.58c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.98 9.98 0 0 0 12 1.6a10 10 0 0 0-8.94 5.5l3.35 2.58C7.2 7.33 9.4 5.58 12 5.58Z"
				fill="#EA4335"
			/>
		</svg>
	);
}
