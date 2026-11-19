import { createContext, type ReactNode, useContext } from "react";
import {
	defaultLocale,
	getMessageNamespace,
	type Locale,
} from "@/i18n/messages";

const BeuiLocaleContext = createContext<Locale>(defaultLocale);

/** One locale for registry-owned labels, including portalled menus and agent cards. */
export function BeuiLocaleProvider({
	locale,
	children,
}: {
	locale: Locale;
	children: ReactNode;
}) {
	return (
		<BeuiLocaleContext.Provider value={locale}>
			{children}
		</BeuiLocaleContext.Provider>
	);
}

export function useBeuiCopy() {
	return getMessageNamespace(useBeuiLocale(), "beui");
}

export function useBeuiLocale() {
	return useContext(BeuiLocaleContext);
}
