import { useRouter } from "@tanstack/react-router";
import { Languages } from "lucide-react";

import {
	getDictionary,
	type Locale,
	locales,
	switchLocalePath,
} from "../i18n/messages";
import {
	Select as BeuiSelect,
	SelectContent as BeuiSelectContent,
	SelectItem as BeuiSelectItem,
	SelectTrigger as BeuiSelectTrigger,
} from "./motion/select";

export function LocaleSwitcher({
	className,
	compact = false,
	currentPath,
	locale,
	portal = false,
}: {
	className?: string;
	compact?: boolean;
	/** Only for callers outside a router, such as a standalone system page. */
	currentPath?: string;
	locale: Locale;
	portal?: boolean;
}) {
	const { t } = getDictionary(locale);
	// Switching language keeps the reader on the page they are reading, so the
	// target is the current route, not the site root. The router is the source of
	// truth wherever there is one; the hash is left out because the server never
	// receives it and the markup has to match.
	const location = useRouter({ warn: false })?.state.location;
	const pagePath = location
		? `${location.pathname}${location.searchStr ?? ""}`
		: (currentPath ?? "/");
	const languages = locales.map((availableLocale) => ({
		flagEmoji: localeFlagEmoji(availableLocale),
		flagSrc: localeFlagSrc(availableLocale),
		label: localeLabel(availableLocale, t),
		locale: availableLocale,
	}));
	const currentLabel =
		languages.find((item) => item.locale === locale)?.label ??
		t("localeSwitcher.english");
	const currentFlagSrc = languages.find(
		(item) => item.locale === locale,
	)?.flagSrc;
	const currentFlagEmoji = languages.find(
		(item) => item.locale === locale,
	)?.flagEmoji;
	const currentCode = locale.toUpperCase();

	return (
		<BeuiSelect
			className={className}
			value={locale}
			onValueChange={(nextLocale) => {
				window.location.href = switchLocalePath(pagePath, nextLocale as Locale);
			}}
		>
			<BeuiSelectTrigger
				aria-label={t("localeSwitcher.selectLanguage")}
				className={
					compact ? "min-w-20 whitespace-nowrap" : "min-w-44 whitespace-nowrap"
				}
			>
				<span className="flex min-w-0 items-center gap-2">
					{!compact && currentFlagSrc ? (
						<img
							alt=""
							data-locale-flag
							className="h-3.5 w-5 shrink-0 rounded-[3px] object-cover ring-1 ring-border/60"
							src={currentFlagSrc}
						/>
					) : !compact ? (
						<span
							aria-hidden="true"
							className="grid size-5 shrink-0 place-items-center text-base"
						>
							{currentFlagEmoji ?? <Languages className="size-4" />}
						</span>
					) : null}
					<span
						data-locale-label
						className={compact ? "sr-only" : "truncate font-medium"}
					>
						{currentLabel}
					</span>
					<span
						data-locale-code
						className="shrink-0 whitespace-nowrap text-xs text-muted-foreground"
					>
						{currentCode}
					</span>
				</span>
			</BeuiSelectTrigger>
			<BeuiSelectContent className="min-w-44" portal={portal}>
				{languages.map((item) => (
					<BeuiSelectItem
						key={item.locale}
						value={item.locale}
						textValue={item.label}
					>
						<span className="flex min-w-0 items-center gap-2.5 whitespace-nowrap">
							{item.flagSrc ? (
								<img
									alt=""
									className="h-3.5 w-5 shrink-0 rounded-[3px] object-cover ring-1 ring-border/60"
									src={item.flagSrc}
								/>
							) : null}
							{!item.flagSrc && item.flagEmoji ? (
								<span
									aria-hidden="true"
									className="grid size-5 place-items-center text-base"
								>
									{item.flagEmoji}
								</span>
							) : null}
							<span>{item.label}</span>
						</span>
					</BeuiSelectItem>
				))}
			</BeuiSelectContent>
		</BeuiSelect>
	);
}

function localeLabel(locale: Locale, t: ReturnType<typeof getDictionary>["t"]) {
	const labels: Partial<Record<Locale, string>> = {
		en: t("localeSwitcher.english"),
		zh: t("localeSwitcher.chinese"),
	};

	return labels[locale] ?? locale.toUpperCase();
}

function localeFlagEmoji(_locale: Locale): string | undefined {
	return undefined;
}

function localeFlagSrc(locale: Locale) {
	const flags: Partial<Record<Locale, string>> = {
		en: usFlagSvg,
		zh: cnFlagSvg,
	};

	return flags[locale];
}

const usFlagSvg =
	"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 7410 3900'%3E%3Cpath fill='%23b22234' d='M0 0h7410v3900H0z'/%3E%3Cpath stroke='%23fff' stroke-width='300' d='M0 450h7410M0 1050h7410M0 1650h7410M0 2250h7410M0 2850h7410M0 3450h7410'/%3E%3Cpath fill='%233c3b6e' d='M0 0h2964v2100H0z'/%3E%3Cg fill='%23fff'%3E%3Cg id='s18'%3E%3Cg id='s9'%3E%3Cg id='s5'%3E%3Cg id='s4'%3E%3Cpath id='s' d='m247 90 70.5 217H545L361 441.5 431.5 658 247 524 62.5 658 133 441.5-51 307h227.5z' transform='scale(.3)'/%3E%3Cuse href='%23s' x='247'/%3E%3Cuse href='%23s' x='494'/%3E%3Cuse href='%23s' x='741'/%3E%3C/g%3E%3Cuse href='%23s' x='988'/%3E%3C/g%3E%3Cuse href='%23s4' x='1235'/%3E%3C/g%3E%3Cuse href='%23s9' x='247' y='210'/%3E%3C/g%3E%3Cuse href='%23s18' y='420'/%3E%3Cuse href='%23s18' y='840'/%3E%3Cuse href='%23s18' y='1260'/%3E%3Cuse href='%23s9' y='1680'/%3E%3C/g%3E%3C/svg%3E";

const cnFlagSvg =
	"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 20'%3E%3Cpath fill='%23de2910' d='M0 0h30v20H0z'/%3E%3Cg fill='%23ffde00'%3E%3Cpath d='m5 2 .588 1.809h1.902L5.951 4.927l.588 1.809L5 5.618 3.461 6.736l.588-1.809L2.51 3.809h1.902z'/%3E%3Cpath d='m10 2 0.176.541h0.569l-0.46.334.176.541L10 3.082l-0.461.334.176-.541-0.46-.334h0.569z' transform='rotate(23.036 10 2)'/%3E%3Cpath d='m12 4 0.176.541h0.569l-0.46.334.176.541L12 5.082l-0.461.334.176-.541-0.46-.334h0.569z' transform='rotate(45.87 12 4)'/%3E%3Cpath d='m12 7 0.176.541h0.569l-0.46.334.176.541L12 8.082l-0.461.334.176-.541-0.46-.334h0.569z' transform='rotate(69.945 12 7)'/%3E%3Cpath d='m10 9 0.176.541h0.569l-0.46.334.176.541L10 10.082l-0.461.334.176-.541-0.46-.334h0.569z' transform='rotate(20.66 10 9)'/%3E%3C/g%3E%3C/svg%3E";
