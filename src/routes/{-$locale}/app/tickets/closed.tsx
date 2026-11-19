import { createFileRoute } from "@tanstack/react-router";
import { Archive, ArrowLeft, ArrowRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AppDataTable } from "@/components/motion/app-data-table";
import { RouterButtonLink } from "@/components/motion/button/router-link";
import { EmptyState } from "@/components/motion/empty-state";
import { Input } from "@/components/motion/input";
import { Surface, SurfaceContent } from "@/components/motion/surface";
import { useAuth } from "../../../../components/auth/auth-state";
import { StatusToneBadge } from "../../../../components/insights";
import { AppConsoleLayout } from "../../../../components/layout/app-console-sidebar";
import {
	AppRouteError,
	AppRouteLoading,
	useProgressiveRouteData,
} from "../../../../components/layout/app-route-states";
import {
	type Locale,
	localePathPrefix,
	localeToIntlTag,
} from "../../../../i18n/messages";
import { useI18n } from "../../../../i18n/use-i18n";
import { getAnalyticsSupport } from "../../../../server/functions/analytics-support";

async function loadClosedSupportTickets() {
	return { support: await getAnalyticsSupport() };
}

export const Route = createFileRoute("/{-$locale}/app/tickets/closed")({
	component: ClosedSupportTicketsPage,
});

type AnalyticsSupportSnapshot = Awaited<
	ReturnType<typeof loadClosedSupportTickets>
>;
type ClosedTicketRow =
	AnalyticsSupportSnapshot["support"]["supportTickets"][number];
type ClosedConversationRow =
	AnalyticsSupportSnapshot["support"]["supportConversations"][number];

export function ClosedSupportTicketsView({
	snapshot,
}: {
	snapshot: AnalyticsSupportSnapshot;
}) {
	const { locale, t } = useI18n();
	const { user } = useAuth();
	const prefix = localePathPrefix(locale);
	const detailRoute = `${prefix}/app/tickets/$ticketId`;
	const [query, setQuery] = useState("");
	const userEmail = user?.email;
	const userConversationIds = new Set(
		snapshot.support.supportConversations
			.filter((conversation) => conversation.requesterEmail === userEmail)
			.map((conversation) => conversation.id),
	);
	const conversationById = new Map(
		snapshot.support.supportConversations.map((conversation) => [
			conversation.id,
			conversation,
		]),
	);
	const closedTickets = snapshot.support.supportTickets.filter(
		(ticket) =>
			ticket.status === "closed" &&
			userConversationIds.has(ticket.conversationId),
	);
	const visibleTickets = useMemo(() => {
		const normalized = query.trim().toLowerCase();
		if (!normalized) return closedTickets;

		return closedTickets.filter((ticket) => {
			const conversation = conversationById.get(ticket.conversationId);

			return [
				ticket.id,
				ticket.summary,
				ticket.slaStatus,
				conversation?.priority,
				conversation?.subject,
			]
				.filter(Boolean)
				.join(" ")
				.toLowerCase()
				.includes(normalized);
		});
	}, [closedTickets, conversationById, query]);

	return (
		<AppConsoleLayout active="tickets" locale={locale} user={user}>
			<div className="grid gap-4" data-beui>
				<Surface>
					<SurfaceContent className="grid gap-4">
						<header className="flex flex-wrap items-start justify-between gap-3">
							<div className="min-w-0">
								<div className="mb-2 inline-flex size-9 items-center justify-center rounded-lg bg-[var(--growth-wash)] text-[var(--color-success)] ring-1 ring-current/20">
									<Archive size={20} />
								</div>
								<h2 className="text-lg font-semibold tracking-tight text-foreground">
									{t("app.tickets.closedArchive")}
								</h2>
								<p className="mt-1 max-w-2xl text-sm text-muted-foreground">
									{t("app.tickets.closedArchiveDescription")}
								</p>
							</div>
							<RouterButtonLink
								to={`${prefix}/app/tickets` as never}
								size="sm"
								variant="outline"
							>
								<ArrowLeft size={16} />
								{t("app.tickets.inbox")}
							</RouterButtonLink>
						</header>

						<label
							className="relative flex max-w-xl items-center"
							htmlFor="closed-tickets-search"
						>
							<Input
								id="closed-tickets-search"
								onChange={(fieldValue) => setQuery(fieldValue)}
								placeholder={t("app.tickets.search")}
								type="search"
								value={query}
								leftIcon={<Search />}
							/>
						</label>

						{visibleTickets.length ? (
							<div className="min-w-0">
								<AppDataTable
									label={t("app.tickets.closedArchive")}
									data={visibleTickets}
									getRowId={(ticket) => ticket.id}
									columns={[
										{
											key: "ticket",
											header: t("app.tickets.ticket"),
											width: "240px",
											cell: (ticket) => (
												<div>
													<RouterButtonLink
														className="h-auto max-w-[220px] min-h-0 justify-start truncate px-0 font-mono text-[13px] max-sm:min-h-11"
														size="sm"
														to={
															detailRoute.replace(
																"$ticketId",
																ticket.id,
															) as never
														}
														title={ticket.id}
														variant="ghost"
													>
														{shortTicketId(ticket.id)}
													</RouterButtonLink>
												</div>
											),
										},
										{
											key: "summary",
											header: t("app.tickets.summary"),
											width: "300px",
											cell: (ticket) => (
												<div>
													<span
														className="block max-w-[360px] truncate text-sm font-semibold text-foreground"
														title={ticket.summary}
													>
														{ticket.summary}
													</span>
												</div>
											),
										},
										{
											key: "priority",
											header: t("app.tickets.priority"),
											width: "160px",
											cell: (ticket) => {
												const conversation = conversationById.get(
													ticket.conversationId,
												);
												return (
													<div>{priorityLabel(conversation?.priority, t)}</div>
												);
											},
										},
										{
											key: "sla",
											header: t("app.tickets.sla"),
											width: "160px",
											cell: (ticket) => (
												<div>
													<StatusToneBadge tone="success">
														{slaLabel(ticket.slaStatus, t)}
													</StatusToneBadge>
												</div>
											),
										},
										{
											key: "updated",
											header: t("app.tickets.updated"),
											width: "160px",
											cell: (ticket) => (
												<div>{formatTicketDate(ticket.updatedAt, locale)}</div>
											),
										},
										{
											key: "action",
											header: t("app.tickets.action"),
											width: "120px",
											align: "right",
											cell: (ticket) => (
												<div>
													<RouterButtonLink
														to={detailRoute.replace("$ticketId", ticket.id)}
														size="sm"
														variant="ghost"
													>
														{t("app.tickets.view")}
														<ArrowRight size={16} />
													</RouterButtonLink>
												</div>
											),
										},
									]}
								/>
							</div>
						) : closedTickets.length ? (
							/* TODO(i18n): 缺少「搜索无结果」专用文案，暂复用 noClosedTickets */
							<EmptyState
								description={t("app.tickets.closedArchiveDescription")}
								title={t("app.tickets.noClosedTickets")}
								variant="search"
							/>
						) : (
							<EmptyState
								description={t("app.tickets.closedArchiveDescription")}
								title={t("app.tickets.noClosedTickets")}
								variant="archive"
							/>
						)}

						<div className="border-t pt-3 text-sm text-muted-foreground">
							{t("app.tickets.showing")} {visibleTickets.length}{" "}
							{t("app.tickets.of")} {closedTickets.length}{" "}
							{t("app.tickets.rows")}
						</div>
					</SurfaceContent>
				</Surface>
			</div>
		</AppConsoleLayout>
	);
}

function ClosedSupportTicketsPage() {
	const { locale } = useI18n();
	const { retry, state } = useProgressiveRouteData(
		"app:tickets",
		loadClosedSupportTickets,
	);
	if (state.status === "loading")
		return <AppRouteLoading active="tickets" locale={locale} />;
	if (state.status === "error") {
		return <AppRouteError active="tickets" locale={locale} retry={retry} />;
	}
	return <ClosedSupportTicketsView snapshot={state.snapshot} />;
}

function shortTicketId(id: string) {
	return id.replace(/^support_ticket_/, "ticket_");
}

function formatTicketDate(value: string, locale: Locale) {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return new Intl.DateTimeFormat(localeToIntlTag(locale), {
		day: "2-digit",
		month: "short",
		year: "numeric",
	}).format(date);
}

function priorityLabel(
	priority: ClosedConversationRow["priority"] | undefined,
	t: ReturnType<typeof useI18n>["t"],
) {
	if (priority === "low") return t("app.tickets.priorityLow");
	if (priority === "high") return t("app.tickets.priorityHigh");
	if (priority === "urgent") return t("app.tickets.priorityUrgent");
	return t("app.tickets.priorityNormal");
}

function slaLabel(
	status: ClosedTicketRow["slaStatus"],
	t: ReturnType<typeof useI18n>["t"],
) {
	if (status === "at_risk") return t("app.tickets.atRisk");
	if (status === "breached") return t("app.tickets.breached");
	return t("app.tickets.withinSla");
}
