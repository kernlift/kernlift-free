"use client";

import { useReducedMotionPreference } from "../../lib/hooks/use-reduced-motion-preference";
// beui.dev/components/motion/tabs

import { MotionConfig, motion, type Transition } from "motion/react";
import {
	type ButtonHTMLAttributes,
	createContext,
	type HTMLAttributes,
	type ReactNode,
	useCallback,
	useContext,
	useId,
	useMemo,
	useState,
} from "react";
import { EASE_OUT } from "../../lib/ease";
import { cn } from "../../lib/utils";

type Variant = "pill" | "underline" | "segment";

type Ctx = {
	value: string;
	setValue: (v: string) => void;
	layoutId: string;
	variant: Variant;
};

const TabsCtx = createContext<Ctx | null>(null);

function useTabs() {
	const ctx = useContext(TabsCtx);
	if (!ctx) throw new Error("Tabs.* must be used inside <Tabs>");
	return ctx;
}

// Weighty spring for the active-tab indicator: a touch of overshoot so it
// settles with life instead of snapping.
const transition: Transition = {
	type: "spring",
	stiffness: 170,
	damping: 24,
	mass: 1.2,
};

export function Tabs({
	defaultValue,
	value,
	onValueChange,
	variant = "pill",
	children,
	className,
}: {
	defaultValue?: string;
	value?: string;
	onValueChange?: (v: string) => void;
	variant?: Variant;
	children: ReactNode;
	className?: string;
}) {
	const [internal, setInternal] = useState(defaultValue ?? "");
	const layoutId = useId();
	const reduce = useReducedMotionPreference();
	const controlled = value !== undefined;
	const current = controlled ? value : internal;
	const setValue = useCallback(
		(v: string) => {
			if (!controlled) setInternal(v);
			onValueChange?.(v);
		},
		[controlled, onValueChange],
	);
	const contextValue = useMemo(
		() => ({ value: current, setValue, layoutId, variant }),
		[current, layoutId, setValue, variant],
	);
	return (
		<MotionConfig transition={reduce ? { duration: 0 } : transition}>
			<TabsCtx.Provider value={contextValue}>
				{/* layoutRoot: the indicator's layoutId measures in page coordinates, so
            inside fixed/scrolled containers it would replay scroll offsets as
            movement. The pill only ever travels within the list, so scoping
            projection to the Tabs wrapper is always correct. */}
				<motion.div layoutRoot className={className}>
					{children}
				</motion.div>
			</TabsCtx.Provider>
		</MotionConfig>
	);
}

const listClasses: Record<Variant, string> = {
	pill: "inline-flex items-center gap-1 rounded-full bg-card p-1",
	underline: "inline-flex items-center gap-1 border-b border-border",
	segment: "inline-flex items-center gap-0 rounded-lg bg-card p-0.5",
};

export function TabsList({
	children,
	className,
	onKeyDown,
	...props
}: HTMLAttributes<HTMLDivElement>) {
	const { variant } = useTabs();
	return (
		<div
			{...props}
			role="tablist"
			className={cn(listClasses[variant], className)}
			onKeyDown={(event) => {
				onKeyDown?.(event);
				if (event.defaultPrevented) return;
				const target = event.target as HTMLElement;
				if (target.getAttribute("role") !== "tab") return;
				const list = event.currentTarget;
				const tabs = Array.from(
					list.querySelectorAll<HTMLButtonElement>(
						'[role="tab"]:not(:disabled)',
					),
				).filter((tab) => tab.closest('[role="tablist"]') === list);
				const index = tabs.indexOf(target as HTMLButtonElement);
				if (index < 0 || !tabs.length) return;
				const vertical = list.getAttribute("aria-orientation") === "vertical";
				const rtl = getComputedStyle(list).direction === "rtl";
				const next = vertical ? "ArrowDown" : rtl ? "ArrowLeft" : "ArrowRight";
				const previous = vertical
					? "ArrowUp"
					: rtl
						? "ArrowRight"
						: "ArrowLeft";
				const nextIndex =
					event.key === "Home"
						? 0
						: event.key === "End"
							? tabs.length - 1
							: event.key === next
								? (index + 1) % tabs.length
								: event.key === previous
									? (index - 1 + tabs.length) % tabs.length
									: -1;
				if (nextIndex < 0) return;
				event.preventDefault();
				tabs[nextIndex].focus();
				tabs[nextIndex].click();
			}}
		>
			{children}
		</div>
	);
}

export function TabsTrigger({
	value,
	children,
	className,
	indicatorClassName,
	onClick,
	...props
}: {
	value: string;
	children: ReactNode;
	className?: string;
	indicatorClassName?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "value">) {
	const { value: current, setValue, layoutId, variant } = useTabs();
	const active = current === value;
	const tabId = `${layoutId}-tab-${encodeURIComponent(value)}`;
	const panelId = `${layoutId}-panel-${encodeURIComponent(value)}`;
	const triggerProps = {
		...props,
		id: tabId,
		"aria-controls": panelId,
		tabIndex: active ? 0 : -1,
		onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
			onClick?.(event);
			if (!event.defaultPrevented) setValue(value);
		},
	};

	if (variant === "underline") {
		return (
			<button
				{...triggerProps}
				type="button"
				role="tab"
				aria-selected={active}
				className={cn(
					"cursor-pointer disabled:cursor-not-allowed aria-disabled:cursor-not-allowed relative isolate px-3 pb-2.5 pt-1 -mb-px text-sm font-medium transition-colors min-h-[44px] inline-flex items-center focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
					"max-sm:min-w-11 pointer-coarse:min-w-11",
					active
						? "text-foreground"
						: "text-muted-foreground hover:text-foreground",
					className,
				)}
			>
				{children}
				{active ? (
					<motion.span
						layoutId={layoutId}
						layout="position"
						className={cn(
							"absolute -bottom-px left-0 right-0 h-px bg-primary",
							indicatorClassName,
						)}
					/>
				) : null}
			</button>
		);
	}

	const radius = variant === "pill" ? "rounded-full" : "rounded-md";

	return (
		<div className="relative">
			{active ? (
				<motion.span
					layoutId={layoutId}
					layout="position"
					style={{ borderRadius: variant === "pill" ? 9999 : 8 }}
					className={cn(
						"absolute inset-0 bg-primary",
						radius,
						indicatorClassName,
					)}
				/>
			) : null}
			<button
				{...triggerProps}
				type="button"
				role="tab"
				aria-selected={active}
				className={cn(
					"cursor-pointer disabled:cursor-not-allowed aria-disabled:cursor-not-allowed relative z-10 inline-flex items-center justify-center whitespace-nowrap bg-transparent px-3.5 py-1.5 text-sm font-medium outline-none",
					"max-sm:min-h-11 max-sm:min-w-11 pointer-coarse:min-h-11 pointer-coarse:min-w-11",
					"transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
					active
						? "text-primary-foreground"
						: "text-muted-foreground hover:text-foreground",
					radius,
					className,
				)}
			>
				{children}
			</button>
		</div>
	);
}

/** Align related form panels without a layout jump; inactive content remains inert. */
export function TabsPanels({
	className,
	...props
}: HTMLAttributes<HTMLDivElement>) {
	return (
		<div {...props} className={cn("grid min-w-0 items-start", className)} />
	);
}

export function TabsContent({
	value,
	children,
	className,
	keepSpace = false,
}: {
	value: string;
	children: ReactNode;
	className?: string;
	/** Use within TabsPanels to reserve the tallest panel without exposing inactive controls. */
	keepSpace?: boolean;
}) {
	const { value: current, layoutId } = useTabs();
	const reduce = useReducedMotionPreference();
	const active = current === value;
	// Keep the same element type and subtree while inactive: switching an editor
	// tab must not destroy its unsaved state or its streaming subscription.
	return (
		<motion.div
			id={`${layoutId}-panel-${encodeURIComponent(value)}`}
			aria-labelledby={`${layoutId}-tab-${encodeURIComponent(value)}`}
			role="tabpanel"
			tabIndex={active ? 0 : -1}
			aria-hidden={!active}
			inert={!active}
			hidden={!keepSpace && !active}
			initial={false}
			animate={{ opacity: active ? 1 : 0, y: active || reduce ? 0 : 4 }}
			transition={{ duration: reduce ? 0 : 0.18, ease: EASE_OUT }}
			className={cn(
				"mt-4 min-w-0",
				keepSpace && "col-start-1 row-start-1",
				keepSpace && !active && "invisible pointer-events-none",
				className,
			)}
		>
			{children}
		</motion.div>
	);
}
