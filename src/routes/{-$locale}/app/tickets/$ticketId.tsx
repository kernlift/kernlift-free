import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { useCallback } from "react";
import { RouterButtonLink } from "@/components/motion/button/router-link";
import { Surface, SurfaceContent } from "@/components/motion/surface";
import { SupportTicketReplyForm } from "../../../../components/analytics/support-ticket-actions";
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
import {
	type Locale,
	localePathPrefix,
	localeToIntlTag,
} from "../../../../i18n/messages";
import { useI18n } from "../../../../i18n/use-i18n";
import { getUserSupportTicketById } from "../../../../server/functions/analytics-support";

export const Route = createFileRoute("/{-$locale}/app/tickets/$ticketId")({
	component: SupportTicketDetailPage,
});

type TicketDetail = Awaited<ReturnType<typeof getUserSupportTicketById>>;
type TicketStatus = TicketDetail["ticket"]["status"];
type TicketSlaStatus = TicketDetail["ticket"]["slaStatus"];
type TicketPriority = TicketDetail["conversation"]["priority"];

export function SupportTicketDetailView({ detail }: { detail: TicketDetail }) {
	const { locale, t } = useI18n();
	const { user } = useAuth();
	const prefix = localePathPrefix(locale);
	const ownsTicket = detail.conversation.requesterEmail === user?.email;
	const publicMessages = detail.messages.filter(
		(message) => message.visibility === "public",
	);

	return (
		<AppConsoleLayout active="tickets" locale={locale} user={user}>
			<div className="grid gap-4" data-beui>
				{!ownsTicket ? (
					<Surface>
						<SurfaceContent className="flex flex-wrap items-center justify-between gap-4">
							<div>
								<h2 className="text-lg font-semibold tracking-tight text-foreground">
									{t("app.tickets.unavailable")}
								</h2>
								<p className="mt-1 text-sm text-muted-foreground">
									{t("app.tickets.unavailableBody")}
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
						</SurfaceContent>
					</Surface>
				) : (
					<>
						<Surface>
							<SurfaceContent className="grid gap-4">
								<header className="flex flex-wrap items-start justify-between gap-3">
									<div className="min-w-0">
										<div className="mb-2 flex flex-wrap items-center gap-2">
											<StatusToneBadge
												tone={ticketStatusTone(detail.ticket.status)}
											>
												{ticketStatusLabel(detail.ticket.status, t)}
											</StatusToneBadge>
											<StatusToneBadge tone={slaTone(detail.ticket.slaStatus)}>
												{slaLabel(detail.ticket.slaStatus, t)}
											</StatusToneBadge>
										</div>
										<h2 className="max-w-4xl truncate text-lg font-semibold tracking-tight text-foreground">
											{detail.conversation.subject}
										</h2>
										<p className="mt-1 max-w-4xl text-sm text-muted-foreground">
											{detail.ticket.summary}
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
							</SurfaceContent>
						</Surface>

						<section className="grid grid-flow-dense grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
							<TicketStatCard
								detail={t("app.tickets.ticket")}
								label={t("app.tickets.status")}
								value={ticketStatusLabel(detail.ticket.status, t)}
							/>
							<TicketStatCard
								detail={t("app.tickets.priority")}
								label={t("app.tickets.sla")}
								value={slaLabel(detail.ticket.slaStatus, t)}
							/>
							<TicketStatCard
								detail={t("app.tickets.conversation")}
								label={t("app.tickets.provider")}
								value={detail.conversation.provider}
							/>
							<TicketStatCard
								detail={t("app.tickets.assignee")}
								label={t("app.tickets.priority")}
								value={priorityLabel(detail.conversation.priority, t)}
							/>
						</section>

						<div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
							<Surface>
								<SurfaceContent className="grid gap-4">
									<div className="flex items-center justify-between gap-3">
										<div>
											<h2 className="text-base font-semibold tracking-tight text-foreground">
												{t("app.tickets.thread")}
											</h2>
											<p className="mt-1 text-sm text-muted-foreground">
												{publicMessages.length} {t("app.tickets.rows")}
											</p>
										</div>
										<MessageCircle className="size-5 text-muted-foreground" />
									</div>
									<div className="grid gap-3">
										{publicMessages.map((message) => (
											<article
												className="rounded-xl border bg-transparent p-4 transition-colors duration-200 hover:bg-muted/15"
												key={message.id}
											>
												<div className="flex flex-wrap items-center justify-between gap-2">
													<div className="min-w-0">
														<p className="truncate text-sm font-semibold text-foreground">
															{message.authorName}
														</p>
														<p className="text-xs text-muted-foreground">
															{message.authorType} /{" "}
															{formatTicketDateTime(message.createdAt, locale)}
														</p>
													</div>
												</div>
												<p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
													{message.body}
												</p>
											</article>
										))}
									</div>
								</SurfaceContent>
							</Surface>

							<div className="grid gap-4 content-start">
								<Surface>
									<SurfaceContent className="grid gap-4">
										<h2 className="text-base font-semibold tracking-tight text-foreground">
											{t("app.tickets.replyAndStatus")}
										</h2>
										<SupportTicketReplyForm
											defaultPriority={detail.conversation.priority}
											defaultStatus={detail.ticket.status}
											locale={locale}
											ticketId={detail.ticket.id}
										/>
									</SurfaceContent>
								</Surface>

								<Surface>
									<SurfaceContent className="grid gap-3">
										<h2 className="text-base font-semibold tracking-tight text-foreground">
											{t("app.tickets.ticketContext")}
										</h2>
										<TicketMeta
											label={t("app.tickets.requester")}
											value={detail.conversation.requesterEmail}
										/>
										<TicketMeta
											label={t("app.tickets.assignee")}
											value={detail.ticket.assignee}
										/>
										<TicketMeta
											label={t("app.tickets.lastMessage")}
											value={formatTicketDateTime(
												detail.conversation.lastMessageAt,
												locale,
											)}
										/>
										<TicketMeta
											label={t("app.tickets.created")}
											value={formatTicketDateTime(
												detail.ticket.createdAt,
												locale,
											)}
										/>
										<TicketMeta
											label={t("app.tickets.updated")}
											value={formatTicketDateTime(
												detail.ticket.updatedAt,
												locale,
											)}
										/>
									</SurfaceContent>
								</Surface>
							</div>
						</div>
					</>
				)}
			</div>
		</AppConsoleLayout>
	);
}

function SupportTicketDetailPage() {
	const { ticketId } = Route.useParams();
	const { locale } = useI18n();
	const load = useCallback(
		() => getUserSupportTicketById({ data: { ticketId } }),
		[ticketId],
	);
	const { retry, state } = useProgressiveRouteData(
		`app:tickets:${ticketId}`,
		load,
	);
	if (state.status === "loading")
		return <AppRouteLoading active="tickets" locale={locale} />;
	if (state.status === "error") {
		return <AppRouteError active="tickets" locale={locale} retry={retry} />;
	}
	return <SupportTicketDetailView detail={state.snapshot} />;
}

function TicketStatCard({
	detail,
	label,
	value,
}: {
	detail: string;
	label: string;
	value: string;
}) {
	return (
		<Surface size="sm">
			<SurfaceContent className="grid gap-1">
				<span className="text-sm text-muted-foreground">{label}</span>
				<span
					className="truncate text-2xl font-semibold tabular-nums text-foreground"
					title={value}
				>
					{value}
				</span>
				<span className="text-xs text-muted-foreground">{detail}</span>
			</SurfaceContent>
		</Surface>
	);
}

function TicketMeta({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-lg border bg-transparent px-3 py-2">
			<p className="text-xs font-medium text-muted-foreground">{label}</p>
			<p
				className="mt-1 truncate text-sm font-semibold text-foreground"
				title={value}
			>
				{value}
			</p>
		</div>
	);
}

function formatTicketDateTime(value: string, locale: Locale) {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return new Intl.DateTimeFormat(localeToIntlTag(locale), {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(date);
}

function ticketStatusTone(status: TicketStatus): StatusTone {
	if (status === "closed") return "success";
	if (status === "waiting") return "warning";
	return "pending";
}

function slaTone(status: TicketSlaStatus): StatusTone {
	if (status === "breached") return "failed";
	if (status === "at_risk") return "warning";
	return "success";
}

function ticketStatusLabel(
	status: TicketStatus,
	t: ReturnType<typeof useI18n>["t"],
) {
	if (status === "triage") return t("app.tickets.triage");
	if (status === "in_progress") return t("app.tickets.inProgress");
	if (status === "waiting") return t("app.tickets.statusWaiting");
	return t("app.tickets.statusClosed");
}

function priorityLabel(
	priority: TicketPriority,
	t: ReturnType<typeof useI18n>["t"],
) {
	if (priority === "low") return t("app.tickets.priorityLow");
	if (priority === "high") return t("app.tickets.priorityHigh");
	if (priority === "urgent") return t("app.tickets.priorityUrgent");
	return t("app.tickets.priorityNormal");
}

function slaLabel(status: TicketSlaStatus, t: ReturnType<typeof useI18n>["t"]) {
	if (status === "at_risk") return t("app.tickets.atRisk");
	if (status === "breached") return t("app.tickets.breached");
	return t("app.tickets.withinSla");
}
