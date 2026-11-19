"use client";

import { useRouter } from "@tanstack/react-router";
import { FieldSet, FormLabel } from "@/beui/form-layout";
import { useId, useState, useTransition } from "react";
import { AdminSaveFeedback, useAdminSave } from "@/components/admin/admin-save";
import { Button } from "@/components/motion/button";
import { Input, Textarea } from "@/components/motion/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "@/components/motion/select";
import { adminEditingMessages } from "@/i18n/admin-editing";
import { supportLabels } from "@/i18n/support-labels";
import { getDictionary, type Locale } from "../../i18n/messages";
import { useI18n } from "../../i18n/use-i18n";
import {
	createSupportTicket,
	replySupportTicket,
	updateSupportTicketAssignment,
} from "../../server/functions/analytics-support";
import { invalidateProgressiveRouteData } from "../layout/app-route-states";

type SupportTicketReplyFormProps = {
	ticketId: string;
	defaultPriority: "low" | "normal" | "high" | "urgent";
	defaultStatus: "triage" | "in_progress" | "waiting" | "closed";
	locale?: Locale;
	onReplied?: () => void;
};

type SupportTicketAssignmentFormProps = {
	ticketId: string;
	defaultAssignee: string;
	defaultPriority: "low" | "normal" | "high" | "urgent";
	defaultStatus: "triage" | "in_progress" | "waiting" | "closed";
	defaultSlaStatus: "within_sla" | "at_risk" | "breached";
	locale?: Locale;
};

type SupportTicketQuickCloseButtonProps = {
	ticketId: string;
	priority: "low" | "normal" | "high" | "urgent";
};

export function SupportTicketCreateForm({
	locale = "en",
	onCreated,
}: {
	locale?: Locale;
	onCreated?: () => void;
}) {
	const { t } = useI18n();
	const router = useRouter();
	const [pending, startTransition] = useTransition();
	const [message, setMessage] = useState("");
	const [priority, setPriority] = useState<
		"low" | "normal" | "high" | "urgent"
	>("normal");
	const priorityOptions = [
		{ label: t("app.tickets.priorityLow"), value: "low" },
		{ label: t("app.tickets.priorityNormal"), value: "normal" },
		{ label: t("app.tickets.priorityHigh"), value: "high" },
		{ label: t("app.tickets.priorityUrgent"), value: "urgent" },
	] as const;

	return (
		<form
			className="grid gap-0"
			onSubmit={(event) => {
				event.preventDefault();
				const formElement = event.currentTarget;
				const form = new FormData(formElement);
				startTransition(async () => {
					try {
						await createSupportTicket({
							data: {
								subject: String(form.get("subject") ?? ""),
								body: String(form.get("body") ?? ""),
								locale,
								priority: String(form.get("priority")) as
									| "low"
									| "normal"
									| "high"
									| "urgent",
							},
						});
						invalidateProgressiveRouteData("app:tickets");
						invalidateProgressiveRouteData("app:dashboard");
						setMessage(t("app.tickets.createSaved"));
						formElement.reset();
						setPriority("normal");
						await router.invalidate();
						onCreated?.();
					} catch (error) {
						setMessage(
							error instanceof Error
								? error.message
								: t("app.tickets.createFailed"),
						);
					}
				});
			}}
		>
			<div className="grid gap-4 px-5 py-5">
				<input name="priority" type="hidden" value={priority} />
				<div className="grid gap-2">
					<FormLabel htmlFor="ticket-subject">
						{t("app.tickets.subject")}
					</FormLabel>
					<Input id="ticket-subject" minLength={3} name="subject" required />
				</div>
				<div className="grid gap-2">
					<FormLabel>{t("app.tickets.priority")}</FormLabel>
					<Select
						onValueChange={(value) =>
							setPriority(
								value === "low" || value === "high" || value === "urgent"
									? value
									: "normal",
							)
						}
						value={priority}
					>
						<SelectTrigger
							className="w-full"
							aria-label={t("app.tickets.priority")}
						>
							<span className="truncate">
								{
									priorityOptions.find((option) => option.value === priority)
										?.label
								}
							</span>
						</SelectTrigger>
						<SelectContent portal>
							{priorityOptions.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="grid gap-2">
					<FormLabel htmlFor="ticket-body">
						{t("app.tickets.message")}
					</FormLabel>
					<Textarea
						className="min-h-36 resize-none"
						id="ticket-body"
						name="body"
						placeholder={t("app.tickets.createPlaceholder")}
						required
						rows={6}
					/>
				</div>
				{message ? (
					<p className="text-sm font-medium text-muted-foreground">{message}</p>
				) : null}
			</div>
			<div className="flex items-center justify-end border-t bg-muted/20 px-5 py-4">
				<Button
					className="h-9 min-w-[132px]"
					disabled={pending}
					type="submit"
					variant="primary"
				>
					{pending ? t("app.tickets.creating") : t("app.tickets.createTicket")}
				</Button>
			</div>
		</form>
	);
}

export function SupportTicketQuickCloseButton({
	ticketId,
	priority,
}: SupportTicketQuickCloseButtonProps) {
	const { t } = useI18n();
	const router = useRouter();
	const [pending, setPending] = useState(false);

	async function closeTicket() {
		setPending(true);
		try {
			await replySupportTicket({
				data: {
					ticketId,
					body: t("app.tickets.closedByRequester"),
					status: "closed",
					priority,
				},
			});
			invalidateProgressiveRouteData("app:tickets");
			invalidateProgressiveRouteData("app:dashboard");
			await router.invalidate();
		} finally {
			setPending(false);
		}
	}

	return (
		<Button
			aria-label={
				pending ? t("app.tickets.closing") : t("app.tickets.closeTicket")
			}
			disabled={pending}
			onClick={closeTicket}
			size="sm"
			title={t("app.tickets.closeTicket")}
			type="button"
			variant="danger"
		>
			{pending ? t("app.tickets.closing") : t("app.tickets.closeTicket")}
		</Button>
	);
}

export function SupportTicketAssignmentForm({
	ticketId,
	defaultAssignee,
	defaultPriority,
	defaultStatus,
	defaultSlaStatus,
	locale = "en",
}: SupportTicketAssignmentFormProps) {
	const { t } = getDictionary(locale);
	const copy = adminEditingMessages[locale];
	const labels = supportLabels(locale);
	const state = useAdminSave("support.write");
	const id = useId();
	const [status, setStatus] = useState(defaultStatus);
	const [priority, setPriority] = useState(defaultPriority);
	const [slaStatus, setSlaStatus] = useState(defaultSlaStatus);
	if (!state.allowed)
		return <p className="m-0 text-sm text-muted-foreground">{copy.readOnly}</p>;
	return (
		<form
			className="@container grid gap-4"
			aria-busy={state.pending}
			onSubmit={(event) => {
				event.preventDefault();
				const formElement = event.currentTarget;
				if (!formElement.reportValidity()) return;
				const form = new FormData(formElement);
				void state.save(async () => {
					await updateSupportTicketAssignment({
						data: {
							ticketId,
							assignee: String(form.get("assignee") ?? "").trim(),
							status,
							priority,
							slaStatus,
							note: String(form.get("note") ?? ""),
						},
					});
					const note = formElement.elements.namedItem("note");
					if (note instanceof HTMLTextAreaElement) note.value = "";
					invalidateProgressiveRouteData("app:tickets");
					invalidateProgressiveRouteData("app:dashboard");
				});
			}}
		>
			<FieldSet
				disabled={state.pending || state.refreshFailed}
				className="grid min-w-0 gap-4"
			>
				<div className="grid gap-2">
					<FormLabel htmlFor={`${id}-assignee`}>
						{t("app.tickets.assignee")}
					</FormLabel>
					<Input
						id={`${id}-assignee`}
						name="assignee"
						defaultValue={defaultAssignee}
						required
					/>
				</div>
				<div className="grid gap-4 @min-[28rem]:grid-cols-2">
					<div className="grid gap-2">
						<FormLabel htmlFor={`${id}-status`}>
							{t("app.tickets.status")}
						</FormLabel>
						<Select
							value={status}
							onValueChange={(value) => setStatus(value as typeof status)}
						>
							<SelectTrigger
								id={`${id}-status`}
								aria-label={t("app.tickets.status")}
								className="w-full"
							>
								<span>{labels.status[status]}</span>
							</SelectTrigger>
							<SelectContent portal>
								{Object.entries(labels.status).map(([value, label]) => (
									<SelectItem key={value} value={value}>
										{label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="grid gap-2">
						<FormLabel htmlFor={`${id}-priority`}>
							{t("app.tickets.priority")}
						</FormLabel>
						<Select
							value={priority}
							onValueChange={(value) => setPriority(value as typeof priority)}
						>
							<SelectTrigger
								id={`${id}-priority`}
								aria-label={t("app.tickets.priority")}
								className="w-full"
							>
								<span>{labels.priority[priority]}</span>
							</SelectTrigger>
							<SelectContent portal>
								{Object.entries(labels.priority).map(([value, label]) => (
									<SelectItem key={value} value={value}>
										{label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
				<div className="grid gap-2">
					<FormLabel htmlFor={`${id}-sla`}>{t("app.tickets.sla")}</FormLabel>
					<Select
						value={slaStatus}
						onValueChange={(value) => setSlaStatus(value as typeof slaStatus)}
					>
						<SelectTrigger
							id={`${id}-sla`}
							aria-label={t("app.tickets.sla")}
							className="w-full"
						>
							<span>{labels.sla[slaStatus]}</span>
						</SelectTrigger>
						<SelectContent portal>
							{Object.entries(labels.sla).map(([value, label]) => (
								<SelectItem key={value} value={value}>
									{label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="grid gap-2">
					<FormLabel htmlFor={`${id}-note`}>
						{t("app.tickets.internalNote")}
					</FormLabel>
					<Textarea
						id={`${id}-note`}
						name="note"
						rows={4}
						className="min-h-28 resize-y"
						aria-describedby={`${id}-note-help`}
						placeholder={t("app.tickets.assignmentPlaceholder")}
					/>
					<p
						id={`${id}-note-help`}
						className="m-0 text-xs text-muted-foreground"
					>
						{copy.internalHelp}
					</p>
				</div>
				<div className="flex justify-end">
					<Button type="submit" disabled={state.pending || state.refreshFailed}>
						{state.pending ? copy.saving : t("app.tickets.saveAssignment")}
					</Button>
				</div>
			</FieldSet>
			<AdminSaveFeedback state={state} locale={locale} />
		</form>
	);
}

export function SupportTicketReplyForm({
	ticketId,
	defaultPriority,
	defaultStatus,
	onReplied,
}: SupportTicketReplyFormProps) {
	const { t } = useI18n();
	const router = useRouter();
	const [pending, startTransition] = useTransition();
	const [message, setMessage] = useState("");
	const [status, setStatus] = useState(defaultStatus);
	const [priority, setPriority] = useState(defaultPriority);
	const statusOptions = [
		{ label: t("app.tickets.triage"), value: "triage" },
		{ label: t("app.tickets.inProgress"), value: "in_progress" },
		{ label: t("app.tickets.statusWaiting"), value: "waiting" },
		{ label: t("app.tickets.statusClosed"), value: "closed" },
	] as const;
	const priorityOptions = [
		{ label: t("app.tickets.priorityLow"), value: "low" },
		{ label: t("app.tickets.priorityNormal"), value: "normal" },
		{ label: t("app.tickets.priorityHigh"), value: "high" },
		{ label: t("app.tickets.priorityUrgent"), value: "urgent" },
	] as const;

	return (
		<form
			className="grid gap-4"
			onSubmit={(event) => {
				event.preventDefault();
				const formElement = event.currentTarget;
				const form = new FormData(formElement);
				startTransition(async () => {
					try {
						await replySupportTicket({
							data: {
								ticketId,
								body: String(form.get("body") ?? ""),
								status,
								priority,
							},
						});
						invalidateProgressiveRouteData("app:tickets");
						invalidateProgressiveRouteData("app:dashboard");
						setMessage(t("app.tickets.replySaved"));
						formElement.reset();
						await router.invalidate();
						onReplied?.();
					} catch (error) {
						setMessage(
							error instanceof Error
								? error.message
								: t("app.tickets.replyFailed"),
						);
					}
				});
			}}
		>
			<div className="grid gap-3 sm:grid-cols-2">
				<div className="grid gap-2">
					<FormLabel>{t("app.tickets.status")}</FormLabel>
					<Select
						onValueChange={(value) =>
							setStatus(
								value === "in_progress" ||
									value === "waiting" ||
									value === "closed"
									? value
									: "triage",
							)
						}
						value={status}
					>
						<SelectTrigger
							className="w-full"
							aria-label={t("app.tickets.status")}
						>
							<span className="truncate">
								{statusOptions.find((option) => option.value === status)?.label}
							</span>
						</SelectTrigger>
						<SelectContent portal>
							{statusOptions.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="grid gap-2">
					<FormLabel>{t("app.tickets.priority")}</FormLabel>
					<Select
						onValueChange={(value) =>
							setPriority(
								value === "low" || value === "high" || value === "urgent"
									? value
									: "normal",
							)
						}
						value={priority}
					>
						<SelectTrigger
							className="w-full"
							aria-label={t("app.tickets.priority")}
						>
							<span className="truncate">
								{
									priorityOptions.find((option) => option.value === priority)
										?.label
								}
							</span>
						</SelectTrigger>
						<SelectContent portal>
							{priorityOptions.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>
			<div className="grid gap-2">
				<FormLabel htmlFor="ticket-reply">{t("app.tickets.reply")}</FormLabel>
				<Textarea
					className="min-h-32 resize-none"
					id="ticket-reply"
					name="body"
					placeholder={t("app.tickets.replyPlaceholder")}
					required
					rows={5}
				/>
			</div>
			<div className="flex flex-wrap items-center justify-between gap-3">
				{message ? (
					<p className="text-sm font-medium text-muted-foreground">{message}</p>
				) : (
					<span />
				)}
				<Button
					className="h-9 min-w-[120px]"
					disabled={pending}
					type="submit"
					variant="primary"
				>
					{pending ? t("app.tickets.saving") : t("app.tickets.saveReply")}
				</Button>
			</div>
		</form>
	);
}
