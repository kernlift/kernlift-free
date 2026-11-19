"use client";

import { AnimatePresence, motion } from "motion/react";
import { forwardRef, useId, useImperativeHandle } from "react";
import { EASE_OUT, SPRING_PRESS } from "../../lib/ease";
import {
	type CheckedFieldProps,
	useCheckedField,
} from "../../lib/hooks/use-checked-field";
import { useReducedMotionPreference } from "../../lib/hooks/use-reduced-motion-preference";
import { cn } from "../../lib/utils";

const CHECK_PATH = "M5 13l4 4L19 7";
const INDETERMINATE_PATH = "M6 12h12";

export interface CheckboxProps extends CheckedFieldProps {
	indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(
	function Checkbox(
		{
			checked,
			defaultChecked,
			onCheckedChange,
			disabled,
			indeterminate,
			label,
			className,
			id: idProp,
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
		const autoId = useId();
		const id = idProp ?? autoId;
		const reduce = useReducedMotionPreference();
		const showMark = current || indeterminate;
		const Container = label ? "label" : "span";
		const path = indeterminate ? INDETERMINATE_PATH : CHECK_PATH;

		return (
			<Container
				data-beui="checkbox"
				htmlFor={label ? id : undefined}
				className={cn(
					"inline-flex min-w-0 items-center gap-3",
					disabled ? "cursor-not-allowed" : "cursor-pointer",
					className,
				)}
			>
				<motion.button
					{...buttonProps}
					ref={triggerRef}
					form={form}
					id={id}
					type="button"
					role="checkbox"
					aria-checked={indeterminate ? "mixed" : current}
					disabled={disabled}
					onClick={(event) => {
						if (!event.currentTarget.matches(":disabled"))
							change(indeterminate ? true : !current);
					}}
					whileTap={reduce || disabled ? undefined : { scale: 0.92 }}
					transition={SPRING_PRESS}
					data-state={
						indeterminate ? "indeterminate" : current ? "checked" : "unchecked"
					}
					className="cursor-pointer disabled:cursor-not-allowed aria-disabled:cursor-not-allowed group inline-flex size-5 shrink-0 items-center justify-center rounded-md outline-none max-sm:size-11 pointer-coarse:size-11 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60"
				>
					<span
						className={cn(
							"inline-flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors duration-200 motion-reduce:transition-none",
							showMark
								? "border-primary bg-primary text-primary-foreground"
								: "border-input bg-background group-hover:border-muted-foreground",
						)}
					>
						<AnimatePresence initial={false}>
							{showMark ? (
								<motion.svg
									key={indeterminate ? "indeterminate" : "checked"}
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth={2}
									strokeLinecap="round"
									strokeLinejoin="round"
									initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 0.5 }}
									animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
									exit={
										reduce
											? { opacity: 0 }
											: { opacity: 0, scale: 0.5, filter: "blur(4px)" }
									}
									transition={
										reduce
											? { duration: 0 }
											: { duration: 0.16, ease: EASE_OUT }
									}
									aria-hidden
								>
									<motion.path
										d={path}
										initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
										animate={{ pathLength: 1 }}
										transition={
											reduce
												? { duration: 0 }
												: {
														duration: indeterminate ? 0.2 : 0.3,
														ease: EASE_OUT,
														delay: 0.04,
													}
										}
									/>
								</motion.svg>
							) : null}
						</AnimatePresence>
					</span>
				</motion.button>
				{label ? (
					<span
						className={cn(
							"min-w-0 select-none text-sm font-medium text-foreground",
							disabled && "opacity-60",
						)}
					>
						{label}
					</span>
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
			</Container>
		);
	},
);
