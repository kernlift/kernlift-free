import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useI18n } from "@/i18n/use-i18n";
export function Frame({
	title,
	admin = false,
	children,
}: {
	title: string;
	admin?: boolean;
	children: ReactNode;
}) {
	const { locale } = useI18n();
	return (
		<AppShell
			currentPage={title}
			activeNav={title}
			mode={admin ? "admin" : "app"}
			locale={locale}
		>
			<section className="mx-auto grid w-full max-w-6xl gap-6">
				{children}
			</section>
		</AppShell>
	);
}
