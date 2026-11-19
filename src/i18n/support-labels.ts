import { getMessageNamespace, type Locale } from "./messages";

export function supportLabels(locale: Locale) {
	const copy = getMessageNamespace(locale, "app").tickets;
	return {
		status: {
			triage: copy.triage,
			in_progress: copy.inProgress,
			waiting: copy.statusWaiting,
			closed: copy.statusClosed,
		},
		priority: {
			low: copy.priorityLow,
			normal: copy.priorityNormal,
			high: copy.priorityHigh,
			urgent: copy.priorityUrgent,
		},
		sla: {
			within_sla: copy.withinSla,
			at_risk: copy.atRisk,
			breached: copy.breached,
		},
	};
}
