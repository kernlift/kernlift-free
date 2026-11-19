"use client";

import { useReducedMotionPreference as useReducedMotion } from "../../lib/hooks/use-reduced-motion-preference";
// beui.dev/components/motion/morphing-modal

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { AnimatePresence, motion, useIsPresent } from "motion/react";
import {
	type ComponentProps,
	forwardRef,
	type ReactNode,
	type RefObject,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { EASE_OUT, SPRING_PANEL } from "../../lib/ease";
import { PresenceGate } from "../../lib/presence-gate";
import { cn } from "../../lib/utils";
import {
	BeuiPortalProvider,
	useBeuiOverlayLayer,
	useBeuiPortalContainer,
} from "../../portal";
import { Button } from "./button/base";

// Keep the registry's content transition while making the departing view inert.
// Forward its DOM ref so AnimatePresence popLayout can measure the same element.
const ModalView = forwardRef<HTMLDivElement, ComponentProps<typeof motion.div>>(
	function ModalView({ style, ...props }, ref) {
		const present = useIsPresent();
		return (
			<motion.div
				{...props}
				ref={ref}
				inert={!present}
				aria-hidden={present ? undefined : true}
				style={{ ...style, pointerEvents: present ? "auto" : "none" }}
			/>
		);
	},
);

export interface MorphingModalProps {
	/** Which view is currently shown. `null` closes the modal. */
	viewId: string | null;
	onClose: () => void;
	children: ReactNode;
	/** "responsive" is edge-to-edge on phones and centered/inset from sm upward. */
	placement?: "bottom" | "center" | "fullscreen" | "responsive";
	className?: string;
	ariaLabel: string;
	initialFocus?: RefObject<HTMLElement | null>;
	/** Explicit focus destination when the trigger may be replaced by the closing action. */
	finalFocus?: DialogPrimitive.Popup.Props["finalFocus"];
	onKeyDown?: DialogPrimitive.Popup.Props["onKeyDown"];
	/** Stable context when the original trigger was removed by a dialog action. */
	fallbackFocus?: RefObject<HTMLElement | null>;
	closeLabel: string;
	contentClassName?: string;
	showCloseButton?: boolean;
	/** Keep an in-flight operation open without exposing a nonfunctional close control. */
	dismissible?: boolean;
}

export function MorphingModal({
	viewId,
	onClose,
	children,
	placement = "bottom",
	className,
	ariaLabel,
	initialFocus,
	finalFocus,
	onKeyDown,
	fallbackFocus,
	closeLabel,
	contentClassName,
	showCloseButton = true,
	dismissible = true,
}: MorphingModalProps) {
	const portalContainer = useBeuiPortalContainer();
	const layer = Math.max(10010, useBeuiOverlayLayer() + 10);
	const [popup, setPopup] = useState<HTMLDivElement | null>(null);
	const open = viewId !== null;
	const wasOpen = useRef(false);
	const returnFocus = useRef<HTMLElement | null>(null);
	if (open && !wasOpen.current && typeof document !== "undefined") {
		returnFocus.current =
			document.activeElement instanceof HTMLElement
				? document.activeElement
				: null;
	}
	wasOpen.current = open;
	const previousView = useRef(viewId);
	useLayoutEffect(() => {
		const changed =
			previousView.current !== null &&
			viewId !== null &&
			previousView.current !== viewId;
		previousView.current = viewId;
		if (!changed || !popup) return;
		const requested = initialFocus?.current;
		if (
			requested &&
			popup.contains(requested) &&
			!requested.closest("[inert]")
		) {
			requested.focus({ preventScroll: true });
			return;
		}
		const active = popup.ownerDocument.activeElement;
		if (!active || !popup.contains(active) || active.closest("[inert]"))
			popup.focus({ preventScroll: true });
	}, [viewId, popup, initialFocus]);
	const reduce = useReducedMotion();
	const fullscreen = placement === "fullscreen";
	const responsive = placement === "responsive";
	const enterY = reduce || fullscreen ? 0 : placement === "bottom" ? 40 : 20;
	const enterScale = reduce || fullscreen ? 1 : 0.97;

	// Mounted only while open, and while open the chrome is two fixed siblings
	// rather than one wrapper: the backdrop spans the viewport edges but carries
	// the scrim colour, and the layer positioning the panel sits inset off every
	// edge (`inset-4`, with the bottom placement's `pb-4` on top of it). Both hang
	// off `PresenceGate`, so interaction releases in the same commit that starts
	// the exit rather than when it ends — `open` is already false for those
	// frames. Editor integration tests cover nested focus and dismissal.
	return (
		<DialogPrimitive.Root
			open={open}
			onOpenChange={(next) => {
				if (!next && dismissible) onClose();
			}}
		>
			<DialogPrimitive.Portal keepMounted container={portalContainer}>
				<AnimatePresence initial={false}>
					{open ? (
						<PresenceGate key="backdrop">
							{({ gate }) => (
								<motion.div
									aria-hidden="true"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									transition={{ duration: 0.2, ease: EASE_OUT }}
									{...gate}
									style={{ ...gate.style, zIndex: layer }}
									className="pointer-events-auto fixed inset-0 z-[80] bg-background/5 [backdrop-filter:blur(14px)_saturate(140%)] [-webkit-backdrop-filter:blur(14px)_saturate(140%)]"
								/>
							)}
						</PresenceGate>
					) : null}

					{open ? (
						<PresenceGate key="panel-layer">
							{({ isPresent, gate }) => (
								// The layer itself never takes pointer events, so it carries
								// `inert` alone rather than the gate's pointer-events value.
								<div
									inert={!isPresent}
									style={{ zIndex: layer }}
									className={cn(
										"pointer-events-none fixed z-[80] flex justify-center",
										fullscreen
											? "inset-0"
											: responsive
												? "inset-0 items-center sm:inset-4"
												: "inset-4",
										!responsive &&
											(placement === "bottom"
												? "items-end pb-4"
												: "items-center"),
									)}
								>
									<DialogPrimitive.Popup
										ref={setPopup}
										initialFocus={initialFocus}
										onKeyDown={onKeyDown}
										finalFocus={
											finalFocus ??
											(fallbackFocus
												? () =>
														returnFocus.current?.isConnected
															? returnFocus.current
															: fallbackFocus.current
												: returnFocus)
										}
										render={
											<motion.div
												key="panel"
												layout
												initial={{ opacity: 0, y: enterY, scale: enterScale }}
												animate={{ opacity: 1, y: 0, scale: 1 }}
												exit={{
													opacity: 0,
													y: enterY,
													scale: reduce || fullscreen ? 1 : 0.98,
													transition: { duration: 0.18, ease: EASE_OUT },
												}}
												transition={SPRING_PANEL}
												{...gate}
											/>
										}
										aria-label={ariaLabel}
										className={cn(
											"pointer-events-auto relative w-full max-w-sm overflow-visible rounded-3xl border border-border bg-background shadow-2xl will-change-transform",
											fullscreen &&
												"h-dvh max-w-none rounded-none border-0 shadow-none",
											className,
										)}
									>
										<BeuiPortalProvider container={popup} local layer={layer}>
											{!dismissible ? null : showCloseButton ? (
												<DialogPrimitive.Close
													aria-label={closeLabel}
													render={
														<Button
															size="icon"
															variant="ghost"
															className="absolute right-3 top-3 z-10"
														/>
													}
												>
													<X className="size-4" />
												</DialogPrimitive.Close>
											) : fullscreen ? null : (
												<DialogPrimitive.Close className="sr-only">
													{closeLabel}
												</DialogPrimitive.Close>
											)}
											<motion.div
												layout="position"
												className={cn(
													"max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl p-5",
													showCloseButton && "pt-14",
													fullscreen &&
														"h-full max-h-none overflow-hidden rounded-none p-0",
													contentClassName,
												)}
											>
												<AnimatePresence mode="popLayout" initial={false}>
													<ModalView
														key={viewId}
														className={fullscreen ? "h-full" : undefined}
														initial={
															reduce
																? { opacity: 0 }
																: { opacity: 0, y: 8, filter: "blur(4px)" }
														}
														animate={
															reduce
																? {
																		opacity: 1,
																		transition: {
																			duration: 0.18,
																			ease: EASE_OUT,
																		},
																	}
																: {
																		opacity: 1,
																		y: 0,
																		filter: "blur(0px)",
																		transition: {
																			duration: 0.24,
																			ease: EASE_OUT,
																		},
																	}
														}
														exit={
															reduce
																? {
																		opacity: 0,
																		transition: {
																			duration: 0.14,
																			ease: EASE_OUT,
																		},
																	}
																: {
																		opacity: 0,
																		y: -8,
																		filter: "blur(4px)",
																		transition: {
																			duration: 0.16,
																			ease: EASE_OUT,
																		},
																	}
														}
													>
														{children}
													</ModalView>
												</AnimatePresence>
											</motion.div>
										</BeuiPortalProvider>
									</DialogPrimitive.Popup>
								</div>
							)}
						</PresenceGate>
					) : null}
				</AnimatePresence>
			</DialogPrimitive.Portal>
		</DialogPrimitive.Root>
	);
}
