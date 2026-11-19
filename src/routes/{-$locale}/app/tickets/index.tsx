import { createFileRoute } from "@tanstack/react-router";
import { Archive, CornerUpRight, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AppDataTable } from "@/components/motion/app-data-table";
import { Button } from "@/components/motion/button";
import { RouterButtonLink } from "@/components/motion/button/router-link";
import { EmptyState } from "@/components/motion/empty-state";
import { Input } from "@/components/motion/input";
import { MorphingModal } from "@/components/motion/morphing-modal";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "@/components/motion/select";
import { Surface, SurfaceContent } from "@/components/motion/surface";
import {
	SupportTicketCreateForm,
	SupportTicketQuickCloseButton,
} from "../../../../components/analytics/support-ticket-actions";
import { useAuth } from "../../../../components/auth/auth-state";
import {
	type StatusTone,
	StatusToneBadge,
} from "../../../../components/insights";
import { AppConsoleLayout } from "../../../../components/layout/app-console-sidebar";
import {
	AppRouteError,
	AppRouteLoading,
	useProgressiveRouteData,
} from "../../../../components/layout/app-route-states";
import { AnimatedNumber } from "../../../../components/motion/animated-number";
import {
	type Locale,
	localePathPrefix,
	localeToIntlTag,
} from "../../../../i18n/messages";
import { useI18n } from "../../../../i18n/use-i18n";
import { getAnalyticsSupport } from "../../../../server/functions/analytics-support";

async function loadSupportTickets() {
	return { support: await getAnalyticsSupport() };
}

export const Route = createFileRoute("/{-$locale}/app/tickets/")({
	component: SupportTicketsPage,
});

type AnalyticsSupportSnapshot = Awaited<ReturnType<typeof loadSupportTickets>>;
type SupportTicketRow =
	AnalyticsSupportSnapshot["support"]["supportTickets"][number];
type SupportConversationRow =
	AnalyticsSupportSnapshot["support"]["supportConversations"][number];
type TicketStatusFilter = "all" | SupportTicketRow["status"];

export function SupportTicketsView({
	snapshot,
}: {
	snapshot: AnalyticsSupportSnapshot;
}) {
	const { locale, t } = useI18n();
	const { user } = useAuth();
	const prefix = localePathPrefix(locale);
	const detailRoute = `${prefix}/app/tickets/$ticketId`;
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<TicketStatusFilter>("all");
	const [createOpen, setCreateOpen] = useState(false);
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
	const userTickets = snapshot.support.supportTickets.filter((ticket) =>
		userConversationIds.has(ticket.conversationId),
	);
	const openTickets = userTickets.filter(
		(ticket) => ticket.status !== "closed",
	);
	const waitingTickets = userTickets.filter(
		(ticket) => ticket.status === "waiting",
	);
	const closedTickets = userTickets.filter(
		(ticket) => ticket.status === "closed",
	);
	const statusOptions = [
		{ label: t("app.tickets.allStatuses"), value: "all" },
		{ label: t("app.tickets.triage"), value: "triage" },
		{ label: t("app.tickets.inProgress"), value: "in_progress" },
		{ label: t("app.tickets.statusWaiting"), value: "waiting" },
	] satisfies Array<{ label: string; value: TicketStatusFilter }>;
	const currentStatusLabel =
		statusOptions.find((option) => option.value === statusFilter)?.label ??
		t("app.tickets.allStatuses");
	const visibleTickets = useMemo(() => {
		const normalized = query.trim().toLowerCase();

		return openTickets.filter((ticket) => {
			const conversation = conversationById.get(ticket.conversationId);
			const matchesStatus =
				statusFilter === "all" || ticket.status === statusFilter;
			const matchesQuery =
				!normalized ||
				[
					ticket.id,
					ticket.summary,
					ticket.status,
					ticket.slaStatus,
					ticket.assignee,
					conversation?.priority,
					conversation?.subject,
				]
					.filter(Boolean)
					.join(" ")
					.toLowerCase()
					.includes(normalized);

			return matchesStatus && matchesQuery;
		});
	}, [conversationById, openTickets, query, statusFilter]);

	return (
		<AppConsoleLayout active="tickets" locale={locale} user={user}>
			<div className="grid gap-4" data-beui>
				<section className="grid grid-flow-dense grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
					<TicketStatCard
						detail={t("app.tickets.activeTickets")}
						label={t("app.tickets.open")}
						value={openTickets.length}
					/>
					<TicketStatCard
						detail={t("app.tickets.needsYourReplyDetail")}
						label={t("app.tickets.waiting")}
						value={waitingTickets.length}
					/>
					<TicketStatCard
						detail={t("app.tickets.archiveDetail")}
						label={t("app.tickets.closed")}
						value={closedTickets.length}
					/>
					<TicketStatCard
						detail={t("app.tickets.conversations")}
						label={t("app.tickets.total")}
						value={userTickets.length}
					/>
				</section>

				<Surface>
					<SurfaceContent className="grid gap-4">
						<header className="flex flex-wrap items-start justify-between gap-3">
							<div className="min-w-0">
								<h2 className="text-lg font-semibold tracking-tight text-foreground">
									{t("app.tickets.title")}
								</h2>
								<p className="mt-1 max-w-2xl text-sm text-muted-foreground">
									{t("app.tickets.description")}
								</p>
							</div>
							<div className="flex flex-wrap items-center gap-2">
								<RouterButtonLink
									to={`${prefix}/app/tickets/closed` as never}
									size="sm"
									variant="outline"
								>
									<Archive size={16} />
									{t("app.tickets.closedArchive")}
								</RouterButtonLink>
								<Button
									onClick={() => setCreateOpen(true)}
									size="sm"
									type="button"
								>
									<Plus size={16} />
									{t("app.tickets.newTicket")}
								</Button>
							</div>
						</header>

						<div className="flex flex-wrap items-center gap-2 rounded-xl border bg-transparent p-3">
							<Select
								onValueChange={(value) =>
									setStatusFilter(value as TicketStatusFilter)
								}
								value={statusFilter}
							>
								<SelectTrigger
									className="w-40"
									aria-label={t("app.tickets.status")}
								>
									<span className="truncate">{currentStatusLabel}</span>
								</SelectTrigger>
								<SelectContent portal>
									{statusOptions.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<label
								className="relative flex min-w-[240px] flex-1 items-center"
								htmlFor="tickets-search"
							>
								<Input
									id="tickets-search"
									onChange={(fieldValue) => setQuery(fieldValue)}
									placeholder={t("app.tickets.search")}
									type="search"
									value={query}
									leftIcon={<Search />}
								/>
							</label>
						</div>

						{visibleTickets.length ? (
							<div className="min-w-0">
								<AppDataTable
									label={t("app.tickets.title")}
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
														className="block max-w-[300px] truncate text-sm font-semibold text-foreground"
														title={ticket.summary}
													>
														{ticket.summary}
													</span>
												</div>
											),
										},
										{
											key: "status",
											header: t("app.tickets.status"),
											width: "160px",
											cell: (ticket) => (
												<div>
													<StatusToneBadge
														tone={ticketStatusTone(ticket.status)}
													>
														{ticketStatusLabel(ticket.status, t)}
													</StatusToneBadge>
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
													<StatusToneBadge tone={slaTone(ticket.slaStatus)}>
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
											cell: (ticket) => {
												const conversation = conversationById.get(
													ticket.conversationId,
												);
												return (
													<div>
														<div className="flex items-center justify-end gap-2">
															<RouterButtonLink
																to={detailRoute.replace("$ticketId", ticket.id)}
																size="sm"
																variant={
																	ticket.status === "waiting"
																		? "primary"
																		: "outline"
																}
															>
																{t("app.tickets.replyAction")}
																<CornerUpRight size={16} />
															</RouterButtonLink>
															<SupportTicketQuickCloseButton
																priority={conversation?.priority ?? "normal"}
																ticketId={ticket.id}
															/>
														</div>
													</div>
												);
											},
										},
									]}
								/>
							</div>
						) : openTickets.length ? (
							/* TODO(i18n): 缺少「筛选无结果」专用文案，暂复用 noTickets/noTicketsBody */
							<EmptyState
								description={t("app.tickets.noTicketsBody")}
								title={t("app.tickets.noTickets")}
								variant="search"
							/>
						) : (
							<EmptyState
								action={
									<Button
										onClick={() => setCreateOpen(true)}
										size="sm"
										type="button"
									>
										<Plus size={16} />
										{t("app.tickets.newTicket")}
									</Button>
								}
								description={t("app.tickets.noTicketsBody")}
								title={t("app.tickets.noTickets")}
								variant="inbox"
							/>
						)}

						<div className="flex items-center justify-between gap-3 border-t pt-3 text-sm text-muted-foreground">
							<span>
								{t("app.tickets.showing")} {visibleTickets.length}{" "}
								{t("app.tickets.of")} {openTickets.length}{" "}
								{t("app.tickets.rows")}
							</span>
						</div>
					</SurfaceContent>
				</Surface>
				<MorphingModal
					ariaLabel={t("app.tickets.newTicket")}
					className="max-h-[min(720px,calc(100dvh-2rem))] max-w-[620px] overflow-y-auto bg-popover"
					closeLabel={t("app.tickets.closeTicket")}
					contentClassName="p-0"
					onClose={() => setCreateOpen(false)}
					placement="center"
					viewId={createOpen ? "create-support-ticket" : null}
				>
					<div className="border-b bg-card px-5 py-5 pr-12">
						<h2 className="font-heading text-base font-medium">
							{t("app.tickets.newTicket")}
						</h2>
						<p className="mt-1 text-sm text-muted-foreground">
							{t("app.tickets.description")}
						</p>
					</div>
					<SupportTicketCreateForm
						locale={locale}
						onCreated={() => setCreateOpen(false)}
					/>
				</MorphingModal>
			</div>
		</AppConsoleLayout>
	);
}

function SupportTicketsPage() {
	const { locale } = useI18n();
	const { retry, state } = useProgressiveRouteData(
		"app:tickets",
		loadSupportTickets,
	);
	if (state.status === "loading")
		return <AppRouteLoading active="tickets" locale={locale} />;
	if (state.status === "error") {
		return <AppRouteError active="tickets" locale={locale} retry={retry} />;
	}
	return <SupportTicketsView snapshot={state.snapshot} />;
}

function TicketStatCard({
	detail,
	label,
	value,
}: {
	detail: string;
	label: string;
	value: number;
}) {
	return (
		<Surface size="sm">
			<SurfaceContent className="grid gap-1">
				<span className="text-sm text-muted-foreground">{label}</span>
				<AnimatedNumber
					className="text-2xl font-semibold tabular-nums text-foreground"
					value={value}
				/>
				<span className="text-xs text-muted-foreground">{detail}</span>
			</SurfaceContent>
		</Surface>
	);
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

function ticketStatusTone(status: SupportTicketRow["status"]): StatusTone {
	if (status === "closed") return "success";
	if (status === "waiting") return "warning";
	return "pending";
}

function slaTone(status: SupportTicketRow["slaStatus"]): StatusTone {
	if (status === "breached") return "failed";
	if (status === "at_risk") return "warning";
	return "success";
}

function ticketStatusLabel(
	status: SupportTicketRow["status"],
	t: ReturnType<typeof useI18n>["t"],
) {
	if (status === "triage") return t("app.tickets.triage");
	if (status === "in_progress") return t("app.tickets.inProgress");
	if (status === "waiting") return t("app.tickets.statusWaiting");
	return t("app.tickets.statusClosed");
}

function priorityLabel(
	priority: SupportConversationRow["priority"] | undefined,
	t: ReturnType<typeof useI18n>["t"],
) {
	if (priority === "low") return t("app.tickets.priorityLow");
	if (priority === "high") return t("app.tickets.priorityHigh");
	if (priority === "urgent") return t("app.tickets.priorityUrgent");
	return t("app.tickets.priorityNormal");
}

function slaLabel(
	status: SupportTicketRow["slaStatus"],
	t: ReturnType<typeof useI18n>["t"],
) {
	if (status === "at_risk") return t("app.tickets.atRisk");
	if (status === "breached") return t("app.tickets.breached");
	return t("app.tickets.withinSla");
}
