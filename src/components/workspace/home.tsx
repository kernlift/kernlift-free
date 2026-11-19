import { Frame } from "./frame";
import { useI18n } from "@/i18n/use-i18n";
import { localizedPath } from "@/i18n/messages";
import { useAuth } from "@/components/auth/auth-state";
import { AdminMetrics } from "@/components/admin/admin-metrics";
export function Home({ data }: { data: { tickets: number; files: number } }) {
	const { locale } = useI18n(),
		zh = locale === "zh",
		session = useAuth().snapshot;
	const links = [
		["/app/profile", zh ? "个人资料" : "My profile"],
		["/app/tickets", zh ? "我的工单" : "My tickets"],
		["/app/assets", zh ? "我的文件" : "My files"],
	];
	return (
		<Frame title={zh ? "个人工作台" : "My workspace"}>
			<p>
				{session.user?.name} · {session.user?.email}
			</p>
			<AdminMetrics
				items={[
					{ label: zh ? "工单" : "Tickets", value: String(data.tickets) },
					{ label: zh ? "文件" : "Files", value: String(data.files) },
				]}
			/>
			<nav className="flex gap-5">
				{links.map(([path, label]) => (
					<a key={path} href={localizedPath(path, locale)}>
						{label}
					</a>
				))}
			</nav>
		</Frame>
	);
}
