import { useI18n } from "@/i18n/use-i18n";
import { localizedPath } from "@/i18n/messages";
import { Frame } from "@/components/workspace/frame";
import { AdminRecords } from "./admin-records";
import { AdminMetrics } from "./admin-metrics";
import UserRegistrationTrend from "./user-registration-trend";
import { UserRoleActions } from "./user-role-actions";
import type { getRegistrations } from "@/server/functions/user-dashboard";
import type { getUsers, getUser } from "@/server/functions/foundation";
import { api, Form } from "@/components/forms";
import { useAuth } from "@/components/auth/auth-state";
type Report = Awaited<ReturnType<typeof getRegistrations>>;
export function RegistrationPage({
	report,
	days,
	countries = false,
	all = false,
}: {
	report: Report;
	days: number;
	countries?: boolean;
	all?: boolean;
}) {
	const { locale } = useI18n(),
		zh = locale === "zh";
	return (
		<Frame
			admin
			title={
				countries
					? zh
						? "国家与地区"
						: "Countries and regions"
					: zh
						? "管理总览"
						: "Admin dashboard"
			}
		>
			<nav className="flex gap-4">
				{countries && (
					<a href="?" aria-current={all ? "page" : undefined}>
						{zh ? "全部时间" : "All time"}
					</a>
				)}
				{[7, 30, 90].map((n) => (
					<a
						key={n}
						aria-current={!all && days === n ? "page" : undefined}
						href={"?days=" + n}
					>
						{n} {zh ? "天" : "days"}
					</a>
				))}
			</nav>
			{countries ? (
				<AdminRecords
					rows={all ? report.allCountries : report.countries}
					rowKey={(r) => r.country || "unknown"}
					columns={[
						{
							key: "country",
							label: zh ? "国家或地区" : "Country or region",
							render: (r) => r.country || (zh ? "未填写" : "Unknown"),
						},
						{
							key: "count",
							label: zh ? "期间注册人数" : "Registrations in period",
							render: (r) => r.count,
						},
					]}
				/>
			) : (
				<>
					<AdminMetrics
						items={[
							{
								label: zh ? "用户总数" : "Total users",
								value: String(report.total),
							},
							{
								label: zh ? "期间新增" : "New registrations",
								value: String(report.newUsers),
							},
							{
								label: zh ? "待处理工单" : "Open tickets",
								value: String(report.openTickets),
							},
						]}
					/>
					<h2>{zh ? "注册趋势" : "Registration trend"}</h2>
					<UserRegistrationTrend rows={report.trend} locale={locale} />
				</>
			)}
		</Frame>
	);
}
export function UserList({
	rows,
}: {
	rows: Awaited<ReturnType<typeof getUsers>>;
}) {
	const { locale } = useI18n(),
		zh = locale === "zh";
	return (
		<Frame admin title={zh ? "用户" : "Users"}>
			<AdminRecords
				rows={rows}
				rowKey={(r) => r.id}
				searchText={(r) => [r.name, r.email, ...r.roles].join(" ")}
				columns={[
					{
						key: "name",
						label: zh ? "姓名" : "Name",
						render: (r) => (
							<a
								href={localizedPath(
									"/admin/users/" + encodeURIComponent(r.id),
									locale,
								)}
							>
								{r.name}
							</a>
						),
					},
					{
						key: "email",
						label: zh ? "邮箱" : "Email",
						render: (r) => r.email,
					},
					{
						key: "roles",
						label: zh ? "角色" : "Roles",
						render: (r) => r.roles.join(", "),
					},
					{
						key: "country",
						label: zh ? "国家或地区" : "Region",
						render: (r) => r.country || "—",
					},
				]}
			/>
		</Frame>
	);
}
export function UserDetail({
	data: { user, roles },
}: {
	data: Awaited<ReturnType<typeof getUser>>;
}) {
	const { locale } = useI18n(),
		zh = locale === "zh",
		auth = useAuth();
	return (
		<Frame admin title={user.name}>
			<dl>
				<dt>{zh ? "邮箱" : "Email"}</dt>
				<dd>{user.email}</dd>
				<dt>{zh ? "角色" : "Roles"}</dt>
				<dd>{user.roles.join(", ")}</dd>
				<dt>{zh ? "状态" : "Status"}</dt>
				<dd>{user.status}</dd>
				<dt>{zh ? "注册时间" : "Registered"}</dt>
				<dd>{user.createdAt}</dd>
			</dl>
			{roles.length > 0 && auth.user?.id !== user.id && (
				<>
					<UserRoleActions user={user} roles={roles} locale={locale} />
					<Form
						button={zh ? "保存账户状态" : "Save account status"}
						submit={async (f) => {
							await api("user-status/" + encodeURIComponent(user.id), f);
							location.reload();
						}}
					>
						<label>
							<input
								type="checkbox"
								name="disabled"
								defaultChecked={user.status === "banned"}
							/>{" "}
							{zh ? "停用账户" : "Disable account"}
						</label>
					</Form>
				</>
			)}
		</Frame>
	);
}
