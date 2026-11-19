import { useNavigate } from "@tanstack/react-router";
import { uiFontFamily } from "@/beui/foundation";
import { ArrowLeft } from "lucide-react";
import { LocaleSwitcher } from "@/components/locale-switcher";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsPanels,
	TabsTrigger,
} from "@/components/motion/tabs";
import { TextLink } from "@/components/motion/text-link";
import { ThemeToggle } from "@/components/motion/theme-toggle";
import { siteConfig } from "@/config/site";
import { authPagesMessages } from "@/i18n/auth-pages";
import {
	getDictionary,
	type Locale,
	localeToHtmlLang,
	localizedPath,
} from "@/i18n/messages";
import { toSafeAuthReturnPath } from "@/lib/safe-redirect";
import { AuthForm } from "./auth-form";

type AuthMode = "sign-in" | "sign-up";

/**
 * Centered beUI Auth composition shared by both bookmarkable auth routes.
 * `redirectTo` is the page to come back to; only a site-relative path outside
 * `/auth` is followed, and it travels with the visitor between the two tabs.
 */
export function AuthPage({
	mode,
	locale = "en",
	redirectTo,
}: {
	mode: AuthMode;
	locale?: Locale;
	redirectTo?: string;
}) {
	const { t } = getDictionary(locale);
	const copy = authPagesMessages[locale];
	const navigate = useNavigate();
	const fallback = localizedPath(siteConfig.signedInHome, locale);
	const returnPath = toSafeAuthReturnPath(redirectTo, fallback);
	// Only carry the parameter forward when the visitor arrived with one.
	const carriedRedirect =
		redirectTo && returnPath !== fallback ? returnPath : undefined;
	const isSignUp = mode === "sign-up";
	return (
		<main
			className="flex min-h-dvh flex-col bg-background text-foreground"
			lang={localeToHtmlLang(locale)}
			style={{ fontFamily: uiFontFamily }}
			data-beui
			data-beui-auth
			data-screen-id="public-entry-auth-v1"
		>
			<header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-5 py-5 sm:px-8">
				<a
					href={localizedPath("/", locale)}
					className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
				>
					<ArrowLeft size={16} aria-hidden />
					{copy.homeLink}
				</a>
				<div className="flex items-center gap-2">
					<LocaleSwitcher compact locale={locale} />
					<ThemeToggle
						aria-label={t("marketing.toggleTheme")}
						variant="circle"
					/>
				</div>
			</header>
			<div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-5 py-8 sm:px-8 sm:py-12 lg:grid-cols-2 lg:gap-24">
				<aside className="relative hidden self-stretch flex-col justify-center border-r border-border pr-16 lg:flex">
					<a
						className="inline-flex w-fit items-center gap-3 text-xl font-semibold tracking-tight"
						href={localizedPath("/", locale)}
					>
						<img alt="" src="/favicon.svg" width={30} height={30} />
						{siteConfig.name}
					</a>
					<h2 className="mt-12 mb-6 whitespace-pre-line text-[clamp(2.4rem,3.8vw,3.5rem)] leading-[1.2] font-medium tracking-[-0.055em]">
						{copy.brandTitle}
					</h2>
					<p className="m-0 max-w-sm text-base leading-8 text-muted-foreground">
						{copy.brandDescription}
					</p>
					<ol className="mt-12 mb-0 grid list-none gap-6 p-0">
						{[copy.brandStepOne, copy.brandStepTwo, copy.brandStepThree].map(
							(label, index) => (
								<li key={label} className="flex items-center gap-4 text-sm">
									<span className="grid size-8 place-items-center rounded-full border border-border text-xs tabular-nums text-[var(--brand-accent)]">
										0{index + 1}
									</span>
									{label}
								</li>
							),
						)}
					</ol>
				</aside>
				<section
					className="mx-auto flex w-full max-w-[25rem] flex-col gap-7"
					aria-labelledby="auth-title"
				>
					<div className="grid gap-3">
						<a
							className="mb-5 inline-flex w-fit items-center gap-2.5 text-lg font-semibold lg:hidden"
							href={localizedPath("/", locale)}
						>
							<img alt="" src="/favicon.svg" width={26} height={26} />
							{siteConfig.name}
						</a>
						<h1
							id="auth-title"
							className="m-0 text-3xl leading-tight font-medium tracking-[-0.04em] sm:text-4xl"
						>
							{isSignUp ? copy.signUpTitle : copy.signInTitle}
						</h1>
						<p className="m-0 text-sm leading-6 text-muted-foreground">
							{isSignUp ? copy.signUpDescription : copy.signInDescription}
						</p>
					</div>
					<Tabs
						value={mode}
						variant="underline"
						onValueChange={(nextMode) => {
							if (
								nextMode === mode ||
								(nextMode !== "sign-in" && nextMode !== "sign-up")
							)
								return;
							void navigate({
								to: localizedPath(`/auth/${nextMode}`, locale),
								search: { redirectTo: carriedRedirect },
								resetScroll: false,
							});
						}}
					>
						<TabsList
							className="mb-7 flex w-full"
							aria-label={copy.modeSwitcher}
						>
							<TabsTrigger
								value="sign-in"
								className="min-h-11 flex-1 justify-center"
							>
								{copy.signInTab}
							</TabsTrigger>
							<TabsTrigger
								value="sign-up"
								className="min-h-11 flex-1 justify-center"
							>
								{copy.signUpTab}
							</TabsTrigger>
						</TabsList>
						<TabsPanels>
							{(["sign-in", "sign-up"] as const).map((panelMode) => (
								<TabsContent
									key={panelMode}
									value={panelMode}
									keepSpace
									className="mt-0"
								>
									<AuthForm
										mode={panelMode}
										locale={locale}
										redirectTo={returnPath}
										showForgotPassword
										socialFirst
										submitLabel={
											panelMode === "sign-up"
												? t("auth.signUp.submit")
												: t("auth.signIn.submit")
										}
									/>
								</TabsContent>
							))}
						</TabsPanels>
					</Tabs>
					<p className="text-center text-xs leading-5 text-muted-foreground">
						{copy.legalPrefix}{" "}
						<TextLink
							className="px-1"
							href={localizedPath("/legal/terms", locale)}
						>
							{copy.terms}
						</TextLink>{" "}
						{copy.legalConnector}{" "}
						<TextLink
							className="px-1"
							href={localizedPath("/legal/privacy", locale)}
						>
							{copy.privacy}
						</TextLink>
					</p>
				</section>
			</div>
			<p className="m-0 px-5 py-6 text-center text-xs text-muted-foreground">
				{copy.brandFootnote}
			</p>
		</main>
	);
}
