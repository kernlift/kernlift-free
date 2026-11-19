import {
	localizedPath,
	switchLocalePath,
	nextLocale,
	type Locale,
} from "@/i18n/messages";
import { useAuth } from "../auth/auth-state";
export function AccountMenu({
	currentPath,
	locale,
}: {
	currentPath: string;
	locale: Locale;
}) {
	const { signOut, user } = useAuth();
	return (
		<div className="flex items-center gap-3 text-sm">
			<a
				href={switchLocalePath(currentPath, nextLocale(locale))}
				lang={nextLocale(locale)}
			>
				{locale === "zh" ? "English" : "中文"}
			</a>
			<a href={localizedPath("/app/profile", locale)}>{user?.name}</a>
			<button
				onClick={async () => {
					await signOut();
					location.assign(localizedPath("/", locale));
				}}
			>
				{locale === "zh" ? "退出" : "Sign out"}
			</button>
		</div>
	);
}
