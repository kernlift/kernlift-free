import { getRouteApi } from "@tanstack/react-router";
import { createTranslator } from "./messages";

const localeRoute = getRouteApi("/{-$locale}");

export function useI18n() {
	const { locale } = localeRoute.useRouteContext();

	return {
		locale,
		t: createTranslator(locale),
	};
}
