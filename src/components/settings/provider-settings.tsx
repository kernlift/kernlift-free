import { useI18n } from "@/i18n/use-i18n";
import { localizedPath } from "@/i18n/messages";
import { Frame } from "@/components/workspace/frame";
import { Form, Field, api } from "@/components/forms";
import type { getSetup, getSettings } from "@/server/functions/foundation";
const groups = {
	auth: ["googleId", "googleSecret", "githubId", "githubSecret"],
	email: ["smtpHost", "smtpPort", "smtpUser", "smtpPassword", "mailFrom"],
	storage: [
		"endpoint",
		"region",
		"bucketName",
		"accessKeyId",
		"secretAccessKey",
	],
} as const;
const fieldNames = {
	googleId: "Google Client ID",
	googleSecret: "Google Client Secret",
	githubId: "GitHub Client ID",
	githubSecret: "GitHub Client Secret",
	smtpHost: "SMTP host",
	smtpPort: "SMTP port",
	smtpUser: "SMTP user",
	smtpPassword: "SMTP password",
	mailFrom: "From address",
	endpoint: "S3 endpoint",
	region: "Region",
	bucketName: "Bucket",
	accessKeyId: "Access key ID",
	secretAccessKey: "Secret access key",
};
export function Providers({
	group,
	data,
}: {
	group: keyof typeof groups;
	data: Awaited<ReturnType<typeof getSettings>>;
}) {
	const { locale } = useI18n(),
		zh = locale === "zh";
	const names = zh
		? { auth: "身份认证", email: "认证邮件", storage: "私有文件存储" }
		: {
				auth: "Authentication",
				email: "Authentication email",
				storage: "Private file storage",
			};
	return (
		<Frame admin title={names[group]}>
			<nav className="flex gap-6">
				{(Object.keys(names) as (keyof typeof groups)[]).map((k) => (
					<a key={k} href={localizedPath("/admin/config/" + k, locale)}>
						{names[k]}
					</a>
				))}
			</nav>
			<Form
				button={zh ? "保存配置" : "Save settings"}
				submit={(f) => api("settings", f)}
			>
				{group === "auth" && (
					<>
						<label>
							{zh ? "邮箱密码登录" : "Email and password"}
							<select
								name="emailPassword"
								defaultValue={data.emailPassword || "on"}
							>
								<option value="on">{zh ? "启用" : "Enabled"}</option>
								<option value="off">{zh ? "关闭" : "Disabled"}</option>
							</select>
						</label>
						<label>
							{zh ? "登录前验证邮箱" : "Require verified email"}
							<select
								name="requireVerification"
								defaultValue={data.requireVerification || "off"}
							>
								<option value="off">{zh ? "可选" : "Optional"}</option>
								<option value="on">{zh ? "必需" : "Required"}</option>
							</select>
						</label>
					</>
				)}
				{groups[group].map((k) => (
					<Field
						key={k}
						name={k}
						label={fieldNames[k]}
						value={data[k]}
						required={false}
						type={/secret|password/i.test(k) ? "password" : "text"}
					/>
				))}
				{group === "email" && (
					<label>
						SMTP TLS
						<select name="smtpSecure" defaultValue={data.smtpSecure || "no"}>
							<option value="no">STARTTLS</option>
							<option value="yes">TLS</option>
						</select>
					</label>
				)}
				<small>
					{zh
						? "已存密钥留空即可保留。"
						: "Leave a stored secret blank to keep it."}
				</small>
			</Form>
		</Frame>
	);
}
export function Setup({
	checks,
	onboarding,
}: {
	checks: Awaited<ReturnType<typeof getSetup>>;
	onboarding: boolean;
}) {
	const { locale } = useI18n(),
		zh = locale === "zh";
	const rows = [
		["database", zh ? "数据库" : "Database", ""],
		["emailPassword", zh ? "邮箱密码登录" : "Email and password", "auth"],
		["github", "GitHub OAuth", "auth"],
		["google", "Google OAuth", "auth"],
		["smtp", zh ? "认证邮件" : "Authentication mail", "email"],
		["storage", zh ? "私有存储" : "Private storage", "storage"],
	] as const;
	return (
		<Frame
			admin
			title={
				onboarding
					? zh
						? "启用检查"
						: "Onboarding"
					: zh
						? "安装检查"
						: "Setup checks"
			}
		>
			<ul className="divide-y divide-border">
				{rows.map(([key, label, group]) => (
					<li key={key} className="flex items-center justify-between py-3">
						<span>{label}</span>
						<span>
							{checks[key]
								? zh
									? "已配置"
									: "Configured"
								: zh
									? "未配置"
									: "Unconfigured"}
						</span>
						{group && (
							<a href={localizedPath("/admin/config/" + group, locale)}>
								{zh ? "配置" : "Configure"}
							</a>
						)}
					</li>
				))}
			</ul>
		</Frame>
	);
}
