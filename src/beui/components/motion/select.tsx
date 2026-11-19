"use client";
// beui.dev/components/motion/select

import { Check, ChevronDown } from "lucide-react";
import {
	type HTMLMotionProps,
	motion,
	type Transition,
	useIsPresent,
	type Variants,
} from "motion/react";
import {
	type ButtonHTMLAttributes,
	createContext,
	forwardRef,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useId,
	useImperativeHandle,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { createPortal } from "react-dom";
import { EASE_OUT } from "../../lib/ease";
import { useReducedMotionPreference } from "../../lib/hooks/use-reduced-motion-preference";
import { cn } from "../../lib/utils";
import { useBeuiPortalContainer, useBeuiPortalCoordinates } from "../../portal";
import { usePopoverPortalPosition } from "./popover-position";

const INSTANT_TRANSITION: Transition = { duration: 0 };

// Spring with bounce powers the unfold/separation; per-property timings in the
// content choreograph it (see SelectContent). Mirrors bouncy-accordion's feel.
const CHEVRON_TRANSITION: Transition = {
	type: "spring",
	duration: 0.4,
	bounce: 0.3,
};

const LIST_VARIANTS: Variants = {
	hidden: {},
	show: { transition: { staggerChildren: 0.035, delayChildren: 0.05 } },
};
const ITEM_VARIANTS: Variants = {
	hidden: { opacity: 0, y: -6, filter: "blur(3px)" },
	show: { opacity: 1, y: 0, filter: "blur(0px)" },
};

type Placement = "bottom" | "top";

interface SelectContextValue {
	triggerRef: React.MutableRefObject<HTMLButtonElement | null>;
	listRef: React.MutableRefObject<HTMLDivElement | null>;
	value: string | undefined;
	open: boolean;
	setOpen: (open: boolean) => void;
	select: (value: string) => void;
	register: (value: string, label: string) => void;
	unregister: (value: string) => void;
	labelFor: (value: string | undefined) => string | undefined;
	reduce: boolean;
	triggerId: string;
	defaultTriggerId: string;
	setTriggerId: (id: string) => void;
	listId: string;
	disabled: boolean;
	placement: Placement;
	setPlacement: (p: Placement) => void;
}

const SelectContext = createContext<SelectContextValue | null>(null);

function useSelectContext(component: string) {
	const ctx = useContext(SelectContext);
	if (!ctx) throw new Error(`${component} must be used within <Select>`);
	return ctx;
}

export interface SelectProps {
	name?: string;
	form?: string;
	value?: string;
	defaultValue?: string;
	onValueChange?: (value: string) => void;
	/**
	 * Controlled open state of the panel. A layout that stacks selects can hold
	 * this to keep exactly one panel open — the panel is absolutely positioned
	 * inside its field, so two open at once paint over each other's options.
	 */
	open?: boolean;
	/** Uncontrolled initial open state. Default false. */
	defaultOpen?: boolean;
	/**
	 * Fires whenever the panel opens or closes. The panel is absolutely
	 * positioned inside the field, so a layout that stacks selects has to know
	 * which one is open to paint it above its neighbours.
	 */
	onOpenChange?: (open: boolean) => void;
	disabled?: boolean;
	className?: string;
	children: ReactNode;
}

export function Select({
	name,
	form,
	value,
	defaultValue,
	onValueChange,
	open: openProp,
	defaultOpen = false,
	onOpenChange,
	disabled = false,
	className,
	children,
}: SelectProps) {
	const reduce = useReducedMotionPreference();
	const present = useIsPresent();
	const baseId = useId();
	const defaultTriggerId = `${baseId}-trigger`;
	const [triggerId, setTriggerId] = useState(defaultTriggerId);
	const rootRef = useRef<HTMLDivElement>(null);
	const formValueRef = useRef<HTMLInputElement>(null);
	const typeahead = useRef({ query: "", at: 0 });
	const triggerRef = useRef<HTMLButtonElement>(null);
	const listRef = useRef<HTMLDivElement>(null);
	const [internalOpen, setInternalOpen] = useState(defaultOpen);
	const [internal, setInternal] = useState(defaultValue);
	const [labels, setLabels] = useState<Map<string, string>>(new Map());
	const [placement, setPlacement] = useState<Placement>("bottom");

	const controlled = value !== undefined;
	const current = controlled ? value : internal;
	const openControlled = openProp !== undefined;
	const open =
		present && !disabled && (openControlled ? openProp : internalOpen);

	const setOpen = useCallback(
		(next: boolean) => {
			if (next && disabled) return;
			if (!openControlled) setInternalOpen(next);
			onOpenChange?.(next);
		},
		[onOpenChange, openControlled, disabled],
	);

	const select = useCallback(
		(next: string) => {
			if (disabled) return;
			if (!controlled) setInternal(next);
			onValueChange?.(next);
			setOpen(false);
			triggerRef.current?.focus();
		},
		[controlled, onValueChange, setOpen, disabled],
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: `open` is the trigger, not an input; the typeahead buffer is cleared every time the list opens or closes
	useEffect(() => {
		typeahead.current = { query: "", at: 0 };
	}, [open]);

	useEffect(() => {
		if (disabled) setInternalOpen(false);
	}, [disabled]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: `form` and `name` change which form owns the hidden input, so the reset listener must be re-bound to the new owner when either changes
	useEffect(() => {
		const owner =
			formValueRef.current?.form ?? rootRef.current?.closest("form");
		if (!owner) return;
		let active = true;
		const reset = (event: Event) => {
			queueMicrotask(() => {
				if (!active || event.defaultPrevented) return;
				if (!controlled) setInternal(defaultValue);
				setOpen(false);
			});
		};
		owner.addEventListener("reset", reset);
		return () => {
			active = false;
			owner.removeEventListener("reset", reset);
		};
	}, [controlled, defaultValue, form, name, setOpen]);

	const register = useCallback((v: string, label: string) => {
		setLabels((m) => (m.get(v) === label ? m : new Map(m).set(v, label)));
	}, []);
	const unregister = useCallback((v: string) => {
		setLabels((m) => {
			if (!m.has(v)) return m;
			const next = new Map(m);
			next.delete(v);
			return next;
		});
	}, []);

	// close on outside pointer / escape
	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape" && !e.defaultPrevented) {
				e.preventDefault();
				setOpen(false);
				triggerRef.current?.focus();
			}
		};
		const onPointer = (e: PointerEvent) => {
			if (
				rootRef.current &&
				!rootRef.current.contains(e.target as Node) &&
				!listRef.current?.contains(e.target as Node)
			)
				setOpen(false);
		};
		window.addEventListener("keydown", onKey);
		window.addEventListener("pointerdown", onPointer);
		return () => {
			window.removeEventListener("keydown", onKey);
			window.removeEventListener("pointerdown", onPointer);
		};
	}, [open, setOpen]);

	const ctx = useMemo<SelectContextValue>(
		() => ({
			triggerRef,
			listRef,
			value: current,
			open,
			setOpen,
			select,
			register,
			unregister,
			labelFor: (v) => (v === undefined ? undefined : labels.get(v)),
			reduce,
			triggerId,
			defaultTriggerId,
			setTriggerId,
			listId: `${baseId}-list`,
			disabled,
			placement,
			setPlacement,
		}),
		[
			current,
			open,
			setOpen,
			select,
			register,
			unregister,
			labels,
			reduce,
			baseId,
			triggerId,
			defaultTriggerId,
			disabled,
			placement,
		],
	);

	return (
		<SelectContext.Provider value={ctx}>
			<div
				ref={rootRef}
				data-beui="select"
				className={cn("relative min-w-0", className)}
				onKeyDown={(event) => {
					if (
						disabled ||
						event.defaultPrevented ||
						event.nativeEvent.isComposing
					)
						return;
					if (open && event.key === "Escape") {
						event.preventDefault();
						event.stopPropagation();
						setOpen(false);
						triggerRef.current?.focus();
						return;
					}
					if (
						!(event.target instanceof HTMLElement) ||
						(!event.target.closest('[role="listbox"]') &&
							event.target !== triggerRef.current)
					)
						return;
					const trigger = rootRef.current?.querySelector<HTMLButtonElement>(
						'button[aria-haspopup="listbox"]',
					);
					if (open && event.key === "Tab") {
						setOpen(false);
						trigger?.focus();
						return;
					}
					const options = Array.from(
						listRef.current?.querySelectorAll<HTMLButtonElement>(
							'[role="option"]:not(:disabled)',
						) ?? [],
					);
					if (!options.length) return;
					const index = options.indexOf(
						document.activeElement as HTMLButtonElement,
					);
					const next =
						open && event.key === "ArrowDown"
							? (index + 1) % options.length
							: open && event.key === "ArrowUp"
								? (index - 1 + options.length) % options.length
								: open && event.key === "Home"
									? 0
									: open && event.key === "End"
										? options.length - 1
										: -1;
					if (next >= 0) {
						event.preventDefault();
						event.stopPropagation();
						options[next]?.focus();
					} else if (
						event.key.length === 1 &&
						!event.ctrlKey &&
						!event.metaKey &&
						!event.altKey &&
						event.key !== " "
					) {
						event.preventDefault();
						event.stopPropagation();
						const now = Date.now();
						const query =
							(now - typeahead.current.at > 700
								? ""
								: typeahead.current.query) + event.key.toLocaleLowerCase();
						typeahead.current = { query, at: now };
						const prefix = [...query].every((letter) => letter === query[0])
							? query[0]
							: query;
						const start = open
							? index
							: options.findIndex(
									(option) => option.dataset.selectValue === current,
								);
						// Continue a word on the current option; repeated letters cycle.
						const firstOffset = prefix.length > 1 ? 0 : 1;
						for (
							let offset = firstOffset;
							offset < options.length + firstOffset;
							offset++
						) {
							const option =
								options[
									(Math.max(start, -1) + offset + options.length) %
										options.length
								];
							if (
								option.dataset.selectLabel
									?.toLocaleLowerCase()
									.startsWith(prefix)
							) {
								const optionValue = option.dataset.selectValue;
								if (open) option.focus();
								else if (optionValue !== undefined) select(optionValue);
								break;
							}
						}
					}
				}}
			>
				{children}
				{name ? (
					<input
						ref={formValueRef}
						type="hidden"
						name={name}
						form={form}
						value={current ?? ""}
						disabled={disabled}
					/>
				) : null}
			</div>
		</SelectContext.Provider>
	);
}

export interface SelectTriggerProps
	extends Omit<HTMLMotionProps<"button">, "children"> {
	className?: string;
	children: ReactNode;
}

export const SelectTrigger = forwardRef<HTMLButtonElement, SelectTriggerProps>(
	function SelectTrigger(
		{ className, children, onClick, onKeyDown, id, ...props },
		ref,
	) {
		const ctx = useSelectContext("SelectTrigger");
		useImperativeHandle(ref, () => ctx.triggerRef.current as HTMLButtonElement);
		const { setTriggerId, defaultTriggerId } = ctx;
		useLayoutEffect(
			() => setTriggerId(id ?? defaultTriggerId),
			[id, defaultTriggerId, setTriggerId],
		);
		const isTop = ctx.placement === "top";
		// edge facing the panel flattens then rounds; the far edge stays rounded.
		// All four corners are specified so none gets stranded when placement flips.
		const kf = ctx.open ? [0, 0, 12] : [12, 0, 12];
		const kfT: Transition = ctx.reduce
			? { duration: 0 }
			: ctx.open
				? { duration: 0.6, times: [0, 0.4, 1], ease: EASE_OUT }
				: { duration: 0.42, times: [0, 0.5, 1], ease: EASE_OUT };
		return (
			<motion.button
				{...props}
				type="button"
				id={id ?? ctx.defaultTriggerId}
				ref={ctx.triggerRef}
				disabled={ctx.disabled || props.disabled}
				aria-haspopup="listbox"
				aria-expanded={ctx.open}
				aria-controls={ctx.listId}
				onClick={(event) => {
					onClick?.(event);
					if (!event.defaultPrevented) ctx.setOpen(!ctx.open);
				}}
				onKeyDown={(event) => {
					onKeyDown?.(event);
					if (
						event.defaultPrevented ||
						!["ArrowDown", "ArrowUp"].includes(event.key)
					)
						return;
					event.preventDefault();
					event.stopPropagation();
					ctx.setOpen(true);
				}}
				// Gooey: the edge facing the panel snaps flat (panel attached) then rounds
				// back once the panel pulls away — the two pinch apart.
				initial={false}
				animate={{
					borderTopLeftRadius: isTop ? kf : 12,
					borderTopRightRadius: isTop ? kf : 12,
					borderBottomLeftRadius: isTop ? 12 : kf,
					borderBottomRightRadius: isTop ? 12 : kf,
				}}
				transition={{
					borderTopLeftRadius: isTop ? kfT : INSTANT_TRANSITION,
					borderTopRightRadius: isTop ? kfT : INSTANT_TRANSITION,
					borderBottomLeftRadius: isTop ? INSTANT_TRANSITION : kfT,
					borderBottomRightRadius: isTop ? INSTANT_TRANSITION : kfT,
				}}
				className={cn(
					"cursor-pointer disabled:cursor-not-allowed aria-disabled:cursor-not-allowed relative z-10 flex w-full items-center justify-between gap-2 rounded-xl border border-input bg-background px-3 py-2 text-sm font-medium text-foreground outline-none transition-colors",
					"hover:border-muted-foreground focus-visible:ring-2 focus-visible:ring-ring",
					"max-sm:min-h-11 pointer-coarse:min-h-11 disabled:pointer-events-none disabled:opacity-50",
					className,
				)}
			>
				{children}
				<motion.span
					aria-hidden
					animate={{ rotate: ctx.open ? 180 : 0 }}
					transition={ctx.reduce ? { duration: 0 } : CHEVRON_TRANSITION}
					className="text-muted-foreground"
				>
					<ChevronDown className="h-4 w-4" />
				</motion.span>
			</motion.button>
		);
	},
);

export interface SelectValueProps {
	placeholder: string;
	className?: string;
}

export function SelectValue({ placeholder, className }: SelectValueProps) {
	const ctx = useSelectContext("SelectValue");
	const label = ctx.labelFor(ctx.value);
	return (
		<span
			className={cn(
				label ? "text-foreground" : "text-muted-foreground",
				className,
			)}
		>
			{label ?? placeholder}
		</span>
	);
}

export interface SelectContentProps {
	"aria-label"?: string;
	/** Portal out of scrolling editor panels while retaining the beUI unfold animation. */
	portal?: boolean;
	className?: string;
	children: ReactNode;
}

export function SelectContent({
	className,
	children,
	portal = false,
	"aria-label": label,
}: SelectContentProps) {
	const ctx = useSelectContext("SelectContent");
	const innerRef = useRef<HTMLDivElement>(null);
	const [height, setHeight] = useState(0);
	const [naturalHeight, setNaturalHeight] = useState(0);
	const open = ctx.open;
	const portalContainer = useBeuiPortalContainer();
	const portalCoordinates = useBeuiPortalCoordinates();
	const [portalReady, setPortalReady] = useState(false);
	useEffect(() => setPortalReady(true), []);
	const layout = usePopoverPortalPosition(
		ctx.triggerRef,
		innerRef,
		portal && portalReady && open,
	);
	const { setPlacement } = ctx;
	useEffect(() => {
		if (!open) return;
		const frame = requestAnimationFrame(() => {
			const options = Array.from(
				innerRef.current?.querySelectorAll<HTMLButtonElement>(
					'[role="option"]:not(:disabled)',
				) ?? [],
			);
			(
				options.find(
					(option) => option.getAttribute("aria-selected") === "true",
				) ?? options[0]
			)?.focus();
		});
		return () => cancelAnimationFrame(frame);
	}, [open]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: `children` and `portalReady` are triggers: new options change the list height, and the portal swaps the observed node once it mounts
	useLayoutEffect(() => {
		const node = innerRef.current;
		if (!node) return;
		const measure = () => {
			setHeight(node.offsetHeight);
			setNaturalHeight(node.scrollHeight);
		};
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(node);
		return () => observer.disconnect();
	}, [children, portalReady]);

	// On open, flip upward when there isn't room below and there's more above.
	useLayoutEffect(() => {
		if (!open || portal) return;
		const trigger = document.getElementById(ctx.triggerId);
		const node = innerRef.current;
		if (!trigger || !node) return;
		const rect = trigger.getBoundingClientRect();
		const h = node.offsetHeight;
		const below = window.innerHeight - rect.bottom;
		const above = rect.top;
		setPlacement(below < h + 16 && above > below ? "top" : "bottom");
	}, [open, ctx.triggerId, setPlacement, portal]);

	const below = layout
		? Math.max(
				0,
				layout.viewport.top +
					layout.viewport.height -
					layout.trigger.top -
					layout.trigger.height -
					20,
			)
		: 0;
	const above = layout
		? Math.max(0, layout.trigger.top - layout.viewport.top - 20)
		: 0;
	useLayoutEffect(() => {
		if (portal && open && layout)
			setPlacement(
				below < Math.min(naturalHeight, 320) && above > below
					? "top"
					: "bottom",
			);
	}, [portal, open, layout, below, above, naturalHeight, setPlacement]);

	// Specify EVERY corner + both margins each render. The near edge (facing the
	// trigger) animates flat->round and the gap opens on that side; the far edge
	// stays rounded and its margin pinned to 0. Setting all of them avoids a
	// stranded square corner when the placement flips between opens.
	const isTop = ctx.placement === "top";
	const nearGap = open ? 8 : 0;
	const nearRadius = open ? 12 : 0;

	const gapT: Transition = open
		? { type: "spring", duration: 0.6, bounce: 0.5, delay: 0.12 }
		: { type: "spring", duration: 0.3, bounce: 0.1 };
	const radiusT: Transition = open
		? { duration: 0.3, ease: EASE_OUT, delay: 0.14 }
		: { duration: 0.16, ease: EASE_OUT };

	// Items stay mounted (open just animates the panel) so each item's label
	// registration persists — otherwise the trigger would fall back to the
	// placeholder the moment the panel closes.
	const content = (
		<motion.div
			ref={ctx.listRef}
			id={ctx.listId}
			role="listbox"
			aria-label={label}
			aria-labelledby={label ? undefined : ctx.triggerId}
			aria-hidden={!open}
			inert={!open}
			initial={false}
			animate={
				ctx.reduce
					? { opacity: open ? 1 : 0, height: open ? height : 0 }
					: {
							opacity: open ? 1 : 0,
							height: open ? height : 0,
							// gap opens on the side facing the trigger
							marginTop: isTop ? 0 : nearGap,
							marginBottom: isTop ? nearGap : 0,
							// near corners go flat->round; far corners stay rounded
							borderTopLeftRadius: isTop ? 12 : nearRadius,
							borderTopRightRadius: isTop ? 12 : nearRadius,
							borderBottomLeftRadius: isTop ? nearRadius : 12,
							borderBottomRightRadius: isTop ? nearRadius : 12,
						}
			}
			transition={
				ctx.reduce
					? INSTANT_TRANSITION
					: {
							opacity: open
								? { duration: 0.18 }
								: { duration: 0.16, delay: 0.12 },
							height: open
								? { type: "spring", duration: 0.42, bounce: 0.14 }
								: { duration: 0.26, ease: EASE_OUT, delay: 0.14 },
							marginTop: isTop ? INSTANT_TRANSITION : gapT,
							marginBottom: isTop ? gapT : INSTANT_TRANSITION,
							borderTopLeftRadius: isTop ? INSTANT_TRANSITION : radiusT,
							borderTopRightRadius: isTop ? INSTANT_TRANSITION : radiusT,
							borderBottomLeftRadius: isTop ? radiusT : INSTANT_TRANSITION,
							borderBottomRightRadius: isTop ? radiusT : INSTANT_TRANSITION,
						}
			}
			style={{
				transformOrigin: isTop ? "bottom" : "top",
				overflow: "hidden",
				pointerEvents: open ? "auto" : "none",
			}}
			// flush against the trigger, then separates into its own rounded pill;
			// sits above or below depending on available space
			className={cn(
				"rounded-xl border border-border bg-background shadow-lg",
				portal ? "relative w-full" : "absolute left-0 right-0 z-20",
				!portal && (isTop ? "bottom-full" : "top-full"),
				className,
			)}
		>
			<motion.div
				ref={innerRef}
				variants={ctx.reduce ? undefined : LIST_VARIANTS}
				initial={false}
				animate={open ? "show" : "hidden"}
				className="max-h-[min(20rem,60dvh)] overflow-y-auto p-1"
				style={
					portal && layout
						? { maxHeight: Math.min(320, isTop ? above : below) }
						: undefined
				}
			>
				{children}
			</motion.div>
		</motion.div>
	);
	if (!portal) return content;
	if (!portalContainer || !portalReady) return null;
	const width = layout
		? Math.min(layout.trigger.width, layout.viewport.width - 24)
		: 0;
	const left = layout
		? Math.max(
				layout.viewport.left + 12,
				Math.min(
					layout.trigger.left,
					layout.viewport.left + layout.viewport.width - 12 - width,
				),
			)
		: 0;
	const top = layout
		? isTop
			? layout.trigger.top - Math.min(height, above) - 8
			: layout.trigger.top + layout.trigger.height
		: 0;
	return createPortal(
		<div
			data-beui-select-portal
			className="fixed z-[10000]"
			style={{
				...portalCoordinates({ left, top, width }),
				visibility: layout ? "visible" : "hidden",
				pointerEvents: open ? "auto" : "none",
			}}
		>
			{content}
		</div>,
		portalContainer,
	);
}

export interface SelectItemProps
	extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "value" | "children"> {
	textValue?: string;
	value: string;
	disabled?: boolean;
	className?: string;
	children: ReactNode;
}

export function SelectItem({
	value,
	textValue,
	disabled = false,
	className,
	children,
	onClick,
	...props
}: SelectItemProps) {
	const ctx = useSelectContext("SelectItem");
	const selected = ctx.value === value;
	const label = textValue ?? (typeof children === "string" ? children : value);

	useLayoutEffect(() => {
		ctx.register(value, label);
		return () => ctx.unregister(value);
	}, [ctx.register, ctx.unregister, value, label]);

	return (
		<motion.div variants={ctx.reduce ? undefined : ITEM_VARIANTS}>
			<button
				{...props}
				type="button"
				role="option"
				data-select-label={label}
				data-select-value={value}
				aria-selected={selected}
				disabled={disabled || ctx.disabled}
				onClick={(event) => {
					onClick?.(event);
					if (!event.defaultPrevented) ctx.select(value);
				}}
				className={cn(
					"cursor-pointer disabled:cursor-not-allowed aria-disabled:cursor-not-allowed flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm outline-none transition-colors",
					selected
						? "bg-muted text-foreground"
						: "text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:bg-muted",
					"max-sm:min-h-11 pointer-coarse:min-h-11 disabled:pointer-events-none disabled:opacity-50",
					className,
				)}
			>
				{children}
				{selected ? <Check className="h-4 w-4 shrink-0" aria-hidden /> : null}
			</button>
		</motion.div>
	);
}
