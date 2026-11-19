import { api, Form } from "@/components/forms";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AdminFacts, AdminPanel } from "@/components/admin/admin-detail";
import { adminRouteFeedback } from "@/components/admin/admin-route-feedback";
import {
	Message,
	MessageBubble,
	MessageBubbleContent,
	MessageContent,
	MessageGroup,
	MessageHeader,
} from "@/components/support/message";
import { RouterButtonLink } from "@/components/motion/button/router-link";
import { StatusTag } from "@/components/motion/status-tag";
import { adminEditingMessages } from "@/i18n/admin-editing";
import { adminWorkspaceMessages } from "@/i18n/admin-workspace";
import { supportLabels } from "@/i18n/support-labels";
import { SupportTicketAssignmentForm } from "../../../../components/analytics/support-ticket-actions";
import { AppShell } from "../../../../components/layout/app-shell";
import {
	getMessageNamespace,
	type Locale,
	localeToIntlTag,
	normalizeLocale,
} from "../../../../i18n/messages";
import { getSupportTicketById } from "../../../../server/functions/analytics-support";

export const Route = createFileRoute("/{-$locale}/admin/support/$ticketId")({
	...adminRouteFeedback,
	loader: ({ params }) =>
		getSupportTicketById({ data: { ticketId: params.ticketId } }),
	component: AdminSupportTicketPage,
});

type SupportTicketDetail = Awaited<ReturnType<typeof getSupportTicketById>>;
export function AdminSupportTicketDetailView({
	detail,
	locale = "en",
}: {
	detail: SupportTicketDetail;
	locale?: Locale;
}) {
	const t = getMessageNamespace(locale, "adminSupportTicketCopy");
	const copy = adminEditingMessages[locale];
	const labels = supportLabels(locale);
	return (
		<AppShell
			activeNav="Admin"
			currentPage={detail?.conversation.subject || t.currentPage}
			locale={locale}
			mode="admin"
			actions={
				<RouterButtonLink
					to="/{-$locale}/admin/support"
					params={{ locale: locale === "en" ? undefined : locale }}
					variant="outline"
				>
					<ArrowLeft size={16} />
					{t.backToInbox}
				</RouterButtonLink>
			}
		>
			{detail ? (
				<div
					className="grid min-w-0 gap-6"
					data-screen-id="admin-support-ticket-detail"
				>
					<AdminPanel title={copy.ticketInfo}>
						<AdminFacts
							columns={3}
							items={[
								{
									label: t.status,
									value: (
										<StatusTag
											tone={
												detail.ticket.status === "closed"
													? "success"
													: "pending"
											}
										>
											{labels.status[detail.ticket.status]}
										</StatusTag>
									),
								},
								{
									label: t.requester,
									value: detail.conversation.requesterEmail,
								},
								{
									label: t.priority,
									value: labels.priority[detail.conversation.priority],
								},
								{ label: t.assignee, value: detail.ticket.assignee },
								{
									label: t.sla,
									value: (
										<StatusTag
											tone={
												detail.ticket.slaStatus === "breached"
													? "failed"
													: detail.ticket.slaStatus === "at_risk"
														? "warning"
														: "success"
											}
										>
											{labels.sla[detail.ticket.slaStatus]}
										</StatusTag>
									),
								},
								{
									label: t.conversation,
									value: copy[detail.conversation.status],
								},
								{
									label: t.provider,
									value:
										detail.conversation.provider === "manual"
											? copy.manual
											: "Crisp",
								},
								{
									label: t.updated,
									value: formatDate(detail.ticket.updatedAt, locale),
								},
								{
									label: t.lastMessage,
									value: formatDate(detail.conversation.lastMessageAt, locale),
								},
							]}
						/>
					</AdminPanel>
					<div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(20rem,2fr)]">
						<AdminPanel title={t.threadTitle}>
							{detail.messages.length ? (
								<MessageGroup spacing="default">
									{detail.messages.map((message) => (
										<Message
											key={message.id}
											from={
												message.authorType === "user" ? "user" : "assistant"
											}
											aria-label={copy[message.authorType]}
										>
											<MessageContent>
												<MessageHeader className="flex-wrap leading-5 [overflow-wrap:anywhere]">
													<strong className="text-sm font-medium text-foreground">
														{message.authorName}
													</strong>
													<span>{copy[message.authorType]}</span>
													<time dateTime={message.createdAt}>
														{formatDate(message.createdAt, locale)}
													</time>
												</MessageHeader>
												<StatusTag
													tone={
														message.visibility === "internal"
															? "warning"
															: "pending"
													}
												>
													{message.visibility === "internal"
														? copy.internalMessage
														: copy.publicMessage}
												</StatusTag>
												<MessageBubble
													variant={
														message.visibility === "internal"
															? "outline"
															: "soft"
													}
													className="max-w-full"
												>
													<MessageBubbleContent className="whitespace-pre-wrap [overflow-wrap:anywhere]">
														{message.body}
													</MessageBubbleContent>
												</MessageBubble>
											</MessageContent>
										</Message>
									))}
								</MessageGroup>
							) : (
								<p className="m-0 text-sm text-muted-foreground">
									{copy.noMessages}
								</p>
							)}
						</AdminPanel>
						<AdminPanel
							title={locale === "zh" ? "回复用户" : "Reply to requester"}
						>
							<Form
								button={locale === "zh" ? "发送回复" : "Send reply"}
								submit={async (f) => {
									await api("support/" + detail.ticket.id, f);
									window.location.reload();
								}}
							>
								<textarea
									required
									maxLength={4000}
									name="message"
									aria-label={locale === "zh" ? "回复内容" : "Reply message"}
								/>
							</Form>
						</AdminPanel>
						<AdminPanel title={t.assignmentTitle}>
							<SupportTicketAssignmentForm
								key={detail.ticket.id}
								ticketId={detail.ticket.id}
								defaultAssignee={detail.ticket.assignee}
								defaultPriority={detail.conversation.priority}
								defaultStatus={detail.ticket.status}
								defaultSlaStatus={detail.ticket.slaStatus}
								locale={locale}
							/>
						</AdminPanel>
					</div>
				</div>
			) : (
				<p role="status" className="text-sm text-muted-foreground">
					{adminWorkspaceMessages[locale].recordMissing}
				</p>
			)}
		</AppShell>
	);
}
function AdminSupportTicketPage() {
	const detail = Route.useLoaderData();
	const { locale } = Route.useParams();
	return (
		<AdminSupportTicketDetailView
			detail={detail}
			locale={normalizeLocale(locale)}
		/>
	);
}
function formatDate(value: string, locale: Locale) {
	const date = new Date(value);
	return Number.isFinite(date.getTime())
		? new Intl.DateTimeFormat(localeToIntlTag(locale), {
				dateStyle: "medium",
				timeStyle: "short",
				timeZone: "UTC",
			}).format(date)
		: "—";
}
