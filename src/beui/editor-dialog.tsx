"use client";
import type { ReactNode, RefObject } from "react";
import { MorphingModal } from "./components/motion/morphing-modal";
import { cn } from "./lib/utils";

/** Shared editor dialog layout; each editor owns its fields and commands. */
export function EditorDialog({
	open,
	onOpenChange,
	title,
	description,
	closeLabel,
	children,
	footer,
	className,
	initialFocus,
	fallbackFocus,
	dismissible = true,
	viewKey = "editor-dialog",
}: {
	open: boolean;
	onOpenChange(open: boolean): void;
	title: string;
	description: string;
	closeLabel: string;
	children: ReactNode;
	footer?: ReactNode;
	className?: string;
	initialFocus?: RefObject<HTMLElement | null>;
	fallbackFocus?: RefObject<HTMLElement | null>;
	dismissible?: boolean;
	viewKey?: string;
}) {
	return (
		<MorphingModal
			viewId={open ? viewKey : null}
			onClose={() => {
				if (dismissible) onOpenChange(false);
			}}
			dismissible={dismissible}
			placement="center"
			ariaLabel={title}
			closeLabel={closeLabel}
			initialFocus={initialFocus}
			fallbackFocus={fallbackFocus}
			className={cn("max-w-2xl", className)}
			contentClassName="p-0 pt-0"
		>
			<header className="sticky top-0 z-10 border-b border-border bg-background px-5 py-4 pr-16 [overflow-wrap:anywhere]">
				<h2 className="m-0 text-base font-semibold text-foreground">{title}</h2>
				{description && (
					<p className="mb-0 mt-1 text-sm text-muted-foreground">
						{description}
					</p>
				)}
			</header>
			{children != null && <div className="p-5">{children}</div>}
			{footer && (
				<footer className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-border bg-background px-5 py-3">
					{footer}
				</footer>
			)}
		</MorphingModal>
	);
}
