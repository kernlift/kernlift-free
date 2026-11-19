import { siteConfig } from "@/config/site";
import { getDictionary, type Locale, localizedPath } from "@/i18n/messages";
import { LocaleSwitcher } from "./locale-switcher";
import { ThemeToggle } from "./motion/theme-toggle";

/** Brand and orientation for the public recovery and system pages. */
export function BrandHeader({ locale }: { locale: Locale }) {
	const { t } = getDictionary(locale);
	return (
		<header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 py-5 sm:px-8">
			<a
				className="inline-flex min-h-11 items-center gap-2.5 text-base font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-ring"
				href={localizedPath("/", locale)}
			>
				<img alt="" src="/favicon.svg" width={26} height={26} />
				{siteConfig.name}
			</a>
			<div className="flex items-center gap-2">
				<LocaleSwitcher compact locale={locale} />
				<ThemeToggle aria-label={t("marketing.toggleTheme")} variant="circle" />
			</div>
		</header>
	);
}
