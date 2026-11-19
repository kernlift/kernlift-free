import { BrandHeader } from "../brand-header";
import { localizedPath, type Locale } from "@/i18n/messages";
import { siteConfig } from "@/config/site";
const copy = {
	home: [
		"Kernlift Free",
		"Kernlift Free",
		"An open-source SaaS starter with accounts, role-based administration, support tickets and private files.",
		"可独立部署的开源 SaaS 基础版，包含账户、角色权限、客服工单和私有文件。",
	],
	about: [
		"About",
		"关于",
		"Build your own service on the MIT-licensed foundation. Your deployment owns its accounts, database and provider configuration.",
		"使用 MIT 许可的基础版搭建自己的服务。每个部署独立管理账户、数据库与供应商配置。",
	],
	pricing: [
		"Pricing",
		"定价",
		"Free includes the complete open-source foundation. Hosting, email and storage are supplied by the operator.",
		"Free 包含开源基础版全部功能，托管、邮件与存储由部署者自行配置。",
	],
	contact: [
		"Contact",
		"联系",
		"Open a ticket from your workspace to reach this site's support team.",
		"在个人工作台提交工单即可联系本站客服。",
	],
	privacy: [
		"Privacy",
		"隐私",
		"This instance stores account details, support messages and file metadata. Contact the operator through your workspace for privacy requests.",
		"本站保存账户信息、客服消息和文件元数据。如需处理个人数据，请从工作台联系管理员。",
	],
	terms: [
		"Terms of use",
		"使用条款",
		"This example site is operated by its deployer. Use the service only for data you are authorised to share.",
		"本站由部署者运营。请仅提交你有权分享的数据。",
	],
	denied: [
		"Permission denied",
		"权限不足",
		"Your account does not have access to this page.",
		"你的账户没有访问此页面的权限。",
	],
	rate: [
		"Too many requests",
		"请求过于频繁",
		"Please wait and try again.",
		"请稍后重试。",
	],
	maintenance: [
		"Maintenance",
		"维护中",
		"Please return when maintenance is complete.",
		"请在维护结束后返回。",
	],
} as const;
export type PublicPageKey = keyof typeof copy;
export function pageHead(page: PublicPageKey, locale: Locale) {
	const i = locale === "zh" ? 1 : 0;
	return {
		meta: [
			{ title: copy[page][i] + " · " + siteConfig.name },
			{ name: "description", content: copy[page][i + 2] },
		],
	};
}
export function PublicPage({
	page,
	locale,
}: {
	page: PublicPageKey;
	locale: Locale;
}) {
	const zh = locale === "zh",
		i = zh ? 1 : 0,
		l = (s: string) => localizedPath(s, locale);
	return (
		<div className="min-h-screen bg-background text-foreground">
			<BrandHeader locale={locale} />
			<main className="mx-auto grid max-w-5xl gap-6 px-6 py-16">
				<h1 className="text-4xl font-semibold">{copy[page][i]}</h1>
				<p className="max-w-prose text-lg text-muted-foreground">
					{copy[page][i + 2]}
				</p>
				<div className="flex flex-wrap gap-5">
					{page === "home" && (
						<>
							<a href={l("/auth/sign-up")}>
								{zh ? "注册账户" : "Create account"}
							</a>
							<a href={l("/auth/sign-in")}>{zh ? "登录" : "Sign in"}</a>
						</>
					)}
					{page === "pricing" && (
						<>
							<a href="https://github.com/kernlift/kernlift-free">
								{zh ? "获取免费源码" : "Get Free source"}
							</a>
							<a
								href={
									"https://kernlift-store.wd-gstar.workers.dev" + l("/pricing")
								}
							>
								{zh ? "查看商业完整版" : "View commercial edition"}
							</a>
						</>
					)}
					<a href={l(page === "contact" ? "/app/tickets" : "/app")}>
						{page === "contact"
							? zh
								? "提交工单"
								: "Open a ticket"
							: zh
								? "进入工作台"
								: "Open workspace"}
					</a>
				</div>
			</main>
			<footer className="mx-auto flex max-w-5xl flex-wrap gap-5 border-t border-border px-6 py-6">
				{(["about", "pricing", "contact", "privacy", "terms"] as const).map(
					(key) => (
						<a key={key} href={l("/" + key)}>
							{copy[key][i]}
						</a>
					),
				)}
			</footer>
		</div>
	);
}
