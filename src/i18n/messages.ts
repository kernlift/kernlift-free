import { enMessages } from "./locales/en/messages";
import { zhMessages } from "./locales/zh/messages";

export const locales = ["en", "zh"] as const;
export const defaultLocale = locales[0];

export type Locale = (typeof locales)[number];

type MessageFormatter = (...args: never[]) => string;

type MessageTree = {
	readonly [key: string]:
		| string
		| readonly unknown[]
		| MessageFormatter
		| MessageTree;
};

const dictionaries = {
	en: enMessages,
	zh: zhMessages,
} as const satisfies Record<Locale, MessageTree>;

type Dictionary = (typeof dictionaries)["en"];
type DotPath<T> = T extends string
	? never
	: T extends readonly unknown[]
		? never
		: T extends MessageFormatter
			? never
			: {
					[Key in Extract<keyof T, string>]: T[Key] extends string
						? Key
						: `${Key}.${DotPath<T[Key]>}`;
				}[Extract<keyof T, string>];

export type MessageKey = DotPath<Dictionary>;

export function normalizeLocale(value: string | undefined): Locale {
	return isLocale(value) ? value : defaultLocale;
}

export function isLocale(value: string | undefined): value is Locale {
	return locales.includes(value as Locale);
}

export function localizedPath(path: string, locale: Locale) {
	const normalizedPath = path.startsWith("/") ? path : `/${path}`;
	const prefix = localePathPrefix(locale);
	if (!prefix) return normalizedPath;

	if (normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`)) {
		return normalizedPath;
	}

	return normalizedPath === "/" ? prefix : `${prefix}${normalizedPath}`;
}

export function localePathPrefix(locale: Locale) {
	return locale === defaultLocale ? "" : `/${locale}`;
}

export function switchLocalePath(path: string, targetLocale: Locale) {
	return localizedPath(removeLocalePathPrefix(path), targetLocale);
}

export function nextLocale(locale: Locale) {
	const currentIndex = locales.indexOf(locale);
	return locales[(currentIndex + 1) % locales.length] ?? defaultLocale;
}

export function removeLocalePathPrefix(path: string) {
	const cleanPath = path || "/";
	const withoutOrigin = cleanPath.startsWith("http")
		? new URL(cleanPath).pathname
		: cleanPath;
	const normalizedPath = withoutOrigin.startsWith("/")
		? withoutOrigin
		: `/${withoutOrigin}`;

	for (const locale of locales) {
		const prefix = localePathPrefix(locale);
		if (!prefix) continue;
		if (normalizedPath === prefix) return "/";
		if (normalizedPath.startsWith(`${prefix}/`)) {
			return normalizedPath.slice(prefix.length) || "/";
		}
	}

	return normalizedPath;
}

export function localeHrefLang(locale: Locale) {
	return locale === "zh" ? "zh-Hans" : locale;
}

/** Canonical BCP 47 tag used by HTML language metadata. */
export function localeToHtmlLang(locale: Locale) {
	return localeHrefLang(locale);
}

/** Region-aware locale used by Intl date, number and display-name formatters. */
export function localeToIntlTag(locale: Locale) {
	const tags = { en: "en-US", zh: "zh-CN" } as const satisfies Record<
		Locale,
		string
	>;
	return tags[locale];
}

export function getDictionary(locale: Locale) {
	return {
		locale,
		t: createTranslator(locale),
	};
}

export function getMessageNamespace<Key extends keyof Dictionary>(
	locale: Locale,
	key: Key,
) {
	return dictionaries[locale][key] as Dictionary[Key];
}

export function createTranslator(locale: Locale) {
	const dictionary = dictionaries[locale];

	return (key: MessageKey) => {
		return readMessage(dictionary, key);
	};
}

export function validateLocaleParity() {
	const [baseLocale, ...otherLocales] = locales;
	const baseKeys = flattenMessageKeys(dictionaries[baseLocale]).sort();

	return otherLocales.map((locale) => {
		const keys = flattenMessageKeys(dictionaries[locale]).sort();
		const missing = baseKeys.filter((key) => !keys.includes(key));
		const extra = keys.filter((key) => !baseKeys.includes(key));

		return {
			locale,
			ok: missing.length === 0 && extra.length === 0,
			missing,
			extra,
		};
	});
}

function readMessage(dictionary: MessageTree, key: MessageKey) {
	const value = key.split(".").reduce<unknown>((node, part) => {
		if (!node || typeof node !== "object") return undefined;
		return (node as Record<string, unknown>)[part];
	}, dictionary);

	if (typeof value === "string") return value;
	return key;
}

function flattenMessageKeys(value: unknown, prefix = ""): string[] {
	if (
		typeof value === "string" ||
		typeof value === "function" ||
		Array.isArray(value)
	) {
		return prefix ? [prefix] : [];
	}
	if (!value || typeof value !== "object") return [];

	return Object.entries(value).flatMap(([key, child]) =>
		flattenMessageKeys(child, prefix ? `${prefix}.${key}` : key),
	);
}
