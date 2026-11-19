"use client";
// beui.dev/components/motion/switch

import { animate, MotionConfig, motion } from "motion/react";
import {
	forwardRef,
	useEffect,
	useId,
	useImperativeHandle,
	useRef,
	useState,
} from "react";
import {
	type CheckedFieldProps,
	useCheckedField,
} from "../../lib/hooks/use-checked-field";
import { useReducedMotionPreference } from "../../lib/hooks/use-reduced-motion-preference";
import { cn } from "../../lib/utils";

// Heavy, deliberate thumb — high mass keeps the travel weighty without wobble.
const THUMB_SPRING = {
	type: "spring",
	stiffness: 800,
	damping: 80,
	mass: 4,
} as const;

export interface SwitchProps extends CheckedFieldProps {
	/** Registry alias; prefer standard aria-label in application code. */
	ariaLabel?: string;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
	function Switch(
		{
			id: idProp,
			"aria-label": accessibleLabel,
			checked,
			defaultChecked,
			onCheckedChange,
			disabled,
			label,
			ariaLabel,
			className,
			name,
			form,
			value = "on",
			...buttonProps
		},
		ref,
	) {
		const { current, change, triggerRef } = useCheckedField({
			checked,
			defaultChecked,
			onCheckedChange,
			form,
		});
		useImperativeHandle(ref, () => triggerRef.current as HTMLButtonElement);
		const generatedId = useId();
		const id = idProp ?? generatedId;
		const thumbRef = useRef<HTMLDivElement>(null);
		const reduce = useReducedMotionPreference();
		const [isPressed, setIsPressed] = useState(false);
		const [isPointer, setIsPointer] = useState(false);

		// Disabled shake feedback when pressed.
		useEffect(() => {
			if (!thumbRef.current || reduce) return;
			if (disabled && isPressed) {
				const animation = animate(
					thumbRef.current,
					{ x: [0, -2, 2, -1, 0] },
					{ delay: 0.2, duration: 0.6 },
				);
				return () => animation.stop();
			}
		}, [disabled, isPressed, reduce]);

		const squish = !disabled && isPointer && isPressed && !reduce;

		return (
			<MotionConfig transition={reduce ? { duration: 0 } : THUMB_SPRING}>
				<span
					data-beui="switch"
					className={cn("inline-flex min-w-0 items-center gap-3", className)}
				>
					<motion.button
						{...buttonProps}
						ref={triggerRef}
						form={form}
						id={id}
						type="button"
						role="switch"
						aria-checked={current}
						aria-label={accessibleLabel ?? ariaLabel}
						disabled={disabled}
						onClick={(event) => {
							if (!event.currentTarget.matches(":disabled")) change(!current);
						}}
						onPointerDown={(e) => {
							setIsPressed(true);
							setIsPointer(e.type.startsWith("pointer"));
						}}
						onPointerUp={() => setIsPressed(false)}
						onPointerLeave={() => setIsPressed(false)}
						onPointerCancel={() => setIsPressed(false)}
						initial={false}
						data-state={current ? "checked" : "unchecked"}
						className="group peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full outline-none max-sm:h-11 pointer-coarse:h-11 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60"
					>
						<span
							className={cn(
								"inline-flex h-7 w-12 shrink-0 items-center rounded-full px-1 transition-colors duration-200 motion-reduce:transition-none",
								current ? "justify-end bg-primary" : "justify-start bg-input",
							)}
						>
							<motion.div
								ref={thumbRef}
								layout
								animate={{ scale: squish ? 0.9 : 1 }}
								className="pointer-events-none block h-5 w-5 rounded-full bg-background shadow-md"
							>
								{/* Stretch toward the destination while active. */}
								<div
									className={cn(
										"size-5",
										squish && (current ? "ml-1" : "mr-1"),
									)}
								/>
							</motion.div>
						</span>
					</motion.button>
					{label ? (
						<label
							htmlFor={id}
							className="min-w-0 cursor-pointer text-sm font-medium text-foreground"
						>
							{label}
						</label>
					) : null}
					{name ? (
						<input
							type="hidden"
							name={name}
							form={form}
							value={value}
							disabled={disabled || !current}
						/>
					) : null}
				</span>
			</MotionConfig>
		);
	},
);
