import type { ComponentProps, ReactNode } from "react";

import { cn } from "../../lib/utils";
import { Tag } from "./tag";

export type StatusTagTone =
	| "success"
	| "warning"
	| "danger"
	| "failed"
	| "pending";

const TONE_CLASS: Record<StatusTagTone, string> = {
	success:
		"border-current/20 bg-[var(--growth-wash)] text-[var(--color-success)]",
	warning:
		"border-current/20 bg-[var(--warning-wash)] text-[var(--warning-amber)]",
	danger:
		"border-current/20 bg-[var(--failure-wash)] text-[var(--failure-red)]",
	failed:
		"border-current/20 bg-[var(--failure-wash)] text-[var(--failure-red)]",
	pending: "border-border bg-muted/65 text-muted-foreground",
};

const TONE_TEXT_CLASS: Record<StatusTagTone, string> = {
	success: "text-[var(--color-success)]",
	warning: "text-[var(--warning-amber)]",
	danger: "text-[var(--failure-red)]",
	failed: "text-[var(--failure-red)]",
	pending: "text-muted-foreground",
};

export function statusToneTextClassName(tone: StatusTagTone) {
	return TONE_TEXT_CLASS[tone];
}

export function StatusTag({
	tone,
	children,
	className,
	...props
}: Omit<ComponentProps<typeof Tag>, "variant"> & {
	tone: StatusTagTone;
	children: ReactNode;
}) {
	return (
		<Tag
			className={cn(TONE_CLASS[tone], className)}
			data-status={tone}
			variant="outline"
			{...props}
		>
			<span aria-hidden className="size-1.5 shrink-0 rounded-full bg-current" />
			{children}
		</Tag>
	);
}
