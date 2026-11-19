import {
	createFileRoute,
	Outlet,
	useRouterState,
} from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { AdminMetrics } from "@/components/admin/admin-metrics";
import { AdminRecords } from "@/components/admin/admin-records";
import { adminRouteFeedback } from "@/components/admin/admin-route-feedback";

import { RouterButtonLink } from "@/components/motion/button/router-link";
import { StatusTag } from "@/components/motion/status-tag";

import { AppShell } from "../../../components/layout/app-shell";

import {
	getMessageNamespace,
	type Locale,
	localeToIntlTag,
	localizedPath,
	normalizeLocale,
} from "../../../i18n/messages";

import { getAdminAnalyticsSupport } from "../../../server/functions/analytics-support";

type SupportLocale = Locale;

export const Route = createFileRoute("/{-$locale}/admin/support")({
	...adminRouteFeedback,
	loader: () =>
		getAdminAnalyticsSupport({ data: { permission: "support.read" } }),
	component: AdminSupportPage,
});

type SupportSnapshot = Awaited<ReturnType<typeof getAdminAnalyticsSupport>>;

export function SupportView({
	locale = "en",
	snapshot,
}: {
	locale?: SupportLocale;
	snapshot: SupportSnapshot;
}) {
	const copy = getMessageNamespace(locale, "supportCopy");
	const ticketCopy = getMessageNamespace(locale, "app").tickets;
	const priorities = {
		low: ticketCopy.priorityLow,
		normal: ticketCopy.priorityNormal,
		high: ticketCopy.priorityHigh,
		urgent: ticketCopy.priorityUrgent,
	};
	const slaLabels = {
		within_sla: ticketCopy.withinSla,
		at_risk: ticketCopy.atRisk,
		breached: ticketCopy.breached,
	};
	const rows = snapshot.supportTickets
		.map((ticket) => ({
			...ticket,
			conversation: snapshot.supportConversations.find(
				(conversation) => conversation.id === ticket.conversationId,
			),
		}))
		.sort(
			(a, b) =>
				new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
		);
	const openTickets = rows.filter((ticket) => ticket.status !== "closed");
	const breachedTickets = openTickets.filter(
		(ticket) => ticket.slaStatus === "breached",
	);
	const urgentTickets = rows.filter(
		(ticket) => ticket.conversation?.priority === "urgent",
	);

	return (
		<AppShell
			activeNav="Admin"
			currentPage={copy.currentPage}
			locale={locale}
			mode="admin"
		>
			<div
				className="grid w-full min-w-0 gap-6"
				data-screen-id="admin-support-inbox"
			>
				<AdminMetrics
					items={[
						{ label: copy.totalTickets, value: formatNumber(rows.length) },
						{
							label: copy.openTickets,
							value: formatNumber(openTickets.length),
						},
						{
							label: copy.breachedTickets,
							value: formatNumber(breachedTickets.length),
						},
						{
							label: copy.urgentTickets,
							value: formatNumber(urgentTickets.length),
						},
					]}
				/>

				<section className="grid min-w-0 gap-3">
					<h2 className="text-lg font-semibold">{copy.recentActivity}</h2>
					<AdminRecords
						title={copy.recentActivity}
						rows={rows}
						rowKey={(row) => row.id}
						emptyLabel={copy.empty}
						searchText={(row) =>
							[
								row.id,
								row.conversation?.subject,
								row.conversation?.requesterEmail,
								row.summary,
								row.assignee,
								row.slaStatus,
							].join(" ")
						}
						columns={[
							{
								key: "ticket",
								label: copy.ticket,
								render: (row) => (
									<>
										<div className="grid gap-1">
											<span className="break-words font-medium">
												{row.conversation?.subject ?? row.id}
											</span>
											<span className="break-words text-xs text-muted-foreground">
												{row.summary}
											</span>
										</div>
									</>
								),
							},
							{
								key: "requester",
								label: copy.requester,
								render: (row) => <>{row.conversation?.requesterEmail ?? "-"}</>,
							},
							{
								key: "priority",
								label: copy.priority,
								render: (row) => (
									<>
										<StatusTag tone={priorityTone(row.conversation?.priority)}>
											{row.conversation?.priority
												? priorities[row.conversation.priority]
												: "-"}
										</StatusTag>
									</>
								),
							},
							{
								key: "sla",
								label: copy.sla,
								render: (row) => (
									<>
										<StatusTag tone={slaTone(row.slaStatus)}>
											{slaLabels[row.slaStatus]}
										</StatusTag>
									</>
								),
							},
							{
								key: "assignee",
								label: copy.assignee,
								render: (row) => <>{row.assignee}</>,
							},
							{
								key: "updated",
								label: copy.updated,
								render: (row) => <>{formatShortDate(row.updatedAt, locale)}</>,
							},
							{
								key: "view",
								label: copy.view,
								render: (row) => (
									<>
										<RouterButtonLink
											aria-label={`${copy.view} ${row.id}`}
											size={"sm"}
											variant={"outline"}
											to="/{-$locale}/admin/support/$ticketId"
											params={{
												locale: locale === "en" ? undefined : locale,
												ticketId: row.id,
											}}
										>
											{copy.view}
											<ArrowRight size={16} />
										</RouterButtonLink>
									</>
								),
							},
						]}
					/>
				</section>
			</div>
		</AppShell>
	);
}

function AdminSupportPage() {
	const snapshot = Route.useLoaderData();
	const { locale } = Route.useParams();
	const normalizedLocale = normalizeLocale(locale);
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const supportPath = localizedPath("/admin/support", normalizedLocale);

	if (pathname.startsWith(`${supportPath}/`)) {
		return <Outlet />;
	}

	return <SupportView locale={normalizedLocale} snapshot={snapshot} />;
}

type Tone = "success" | "warning" | "failed" | "pending";

function priorityTone(
	priority: "low" | "normal" | "high" | "urgent" | undefined,
): Tone {
	if (priority === "urgent") return "failed";
	if (priority === "high") return "warning";
	return "pending";
}

function slaTone(status: "within_sla" | "at_risk" | "breached"): Tone {
	if (status === "breached") return "failed";
	if (status === "at_risk") return "warning";
	return "success";
}

function formatNumber(value: number) {
	return new Intl.NumberFormat("en-US").format(value);
}

function formatShortDate(value: string, locale: SupportLocale) {
	return new Intl.DateTimeFormat(localeToIntlTag(locale), {
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		month: "short",
	}).format(new Date(value));
}
