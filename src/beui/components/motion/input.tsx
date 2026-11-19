"use client";

import { AnimatePresence, animate, motion } from "motion/react";
import {
	forwardRef,
	type InputHTMLAttributes,
	type ReactNode,
	type TextareaHTMLAttributes,
	useEffect,
	useId,
	useRef,
	useState,
} from "react";
import { useReducedMotionPreference as useReducedMotion } from "../../lib/hooks/use-reduced-motion-preference";
import { cn } from "../../lib/utils";

export type InputClassNames = {
	root?: string;
	label?: string;
	field?: string;
	input?: string;
	leftIcon?: string;
	rightIcon?: string;
	successIcon?: string;
	errorMessage?: string;
};

export interface InputProps
	extends Omit<
		InputHTMLAttributes<HTMLInputElement>,
		"value" | "defaultValue" | "onChange"
	> {
	label?: string;
	value?: string | number;
	defaultValue?: string | number;
	onChange?: (value: string) => void;
	/** Truthy error triggers a shake, red border and (if a string) a message. */
	error?: string | boolean;
	/** Reserve one message line so validation does not shift nearby content. */
	reserveErrorLine?: boolean;
	success?: boolean;
	leftIcon?: ReactNode;
	rightIcon?: ReactNode;
	className?: string;
	classNames?: InputClassNames;
	/** Inline document editing; keeps the shared focus, validation and input behavior. */
	appearance?: "default" | "editor";
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
	{
		label,
		value: valueProp,
		defaultValue,
		onChange,
		onFocus,
		onBlur,
		error,
		reserveErrorLine = false,
		success,
		leftIcon,
		rightIcon,
		className,
		classNames,
		appearance = "default",
		disabled,
		id: idProp,
		type,
		...rest
	},
	ref,
) {
	const reactId = useId();
	const id = idProp ?? reactId;
	const reduce = useReducedMotion();

	const [focused, setFocused] = useState(false);

	const fieldRef = useRef<HTMLDivElement>(null);

	const hasError =
		Boolean(error) ||
		rest["aria-invalid"] === true ||
		rest["aria-invalid"] === "true";
	const errorMessage = typeof error === "string" ? error : null;

	// Right edge shows the success check, otherwise the caller's right icon.
	const rightSlot = success ? null : rightIcon;

	// Shake the field when an error appears.
	useEffect(() => {
		if (!fieldRef.current || reduce || !hasError) return;
		const animation = animate(
			fieldRef.current,
			{ x: [0, -6, 6, -4, 4, -2, 0] },
			{ duration: 0.45 },
		);
		return () => animation.stop();
	}, [hasError, reduce]);

	const handleChange = (next: string) => {
		onChange?.(next);
	};

	return (
		<div
			data-beui="input"
			className={cn(
				"flex min-w-0 flex-col gap-1.5",
				className,
				classNames?.root,
			)}
		>
			{label ? (
				<label
					htmlFor={id}
					className={cn(
						"px-1 text-sm font-medium text-foreground",
						classNames?.label,
					)}
				>
					{label}
				</label>
			) : null}

			<div
				ref={fieldRef}
				data-state={
					hasError
						? "error"
						: success
							? "success"
							: focused
								? "focused"
								: "idle"
				}
				className={cn(
					"relative overflow-hidden border transition-colors duration-200",
					appearance === "editor"
						? "h-9 rounded-md border-transparent hover:border-border hover:bg-muted/40 max-sm:h-11 pointer-coarse:h-11"
						: "h-11 rounded-full border-input",
					focused && !hasError && "border-ring ring-2 ring-ring/40",
					hasError && "border-destructive ring-2 ring-destructive/25",
					disabled && "opacity-60",
					classNames?.field,
				)}
			>
				{leftIcon ? (
					<span
						className={cn(
							"pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 items-center text-muted-foreground [&_svg]:h-4 [&_svg]:w-4",
							classNames?.leftIcon,
						)}
					>
						{leftIcon}
					</span>
				) : null}

				<input
					ref={ref}
					id={id}
					type={type}
					value={valueProp === undefined ? undefined : String(valueProp ?? "")}
					defaultValue={valueProp === undefined ? defaultValue : undefined}
					disabled={disabled}
					{...rest}
					aria-invalid={hasError || rest["aria-invalid"]}
					aria-describedby={
						[rest["aria-describedby"], errorMessage ? `${id}-error` : null]
							.filter(Boolean)
							.join(" ") || undefined
					}
					onChange={(e) => handleChange(e.target.value)}
					onFocus={(event) => {
						setFocused(true);
						onFocus?.(event);
					}}
					onBlur={(event) => {
						setFocused(false);
						onBlur?.(event);
					}}
					className={cn(
						"peer h-full w-full rounded-none border-0 shadow-none focus-visible:ring-0 bg-transparent text-base leading-6 text-foreground caret-foreground outline-none",
						"placeholder:text-muted-foreground",
						leftIcon ? "pl-10" : "pl-3.5",
						rightSlot || success ? "pr-10" : "pr-3.5",
						appearance === "editor" &&
							"px-2 text-sm max-sm:text-base pointer-coarse:text-base",
						disabled && "cursor-not-allowed",
						classNames?.input,
					)}
				/>

				{success ? (
					<motion.svg
						viewBox="0 0 24 24"
						fill="none"
						className={cn(
							"absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-(--color-success)",
							classNames?.successIcon,
						)}
					>
						<motion.path
							d="M5 12.5l4.5 4.5L19 7.5"
							stroke="currentColor"
							strokeWidth={2}
							strokeLinecap="round"
							strokeLinejoin="round"
							initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
							animate={{ pathLength: 1 }}
							transition={{ duration: 0.35, ease: "easeOut" }}
						/>
					</motion.svg>
				) : rightSlot ? (
					<span
						className={cn(
							"absolute right-0 top-0 flex h-full items-center text-muted-foreground [&_button]:grid [&_button]:size-11 [&_button]:place-items-center [&_svg]:h-4 [&_svg]:w-4",
							classNames?.rightIcon,
						)}
					>
						{rightSlot}
					</span>
				) : null}
			</div>

			<div className={reserveErrorLine ? "min-h-4" : "contents"}>
				<AnimatePresence initial={false}>
					{errorMessage ? (
						<motion.p
							id={`${id}-error`}
							role="alert"
							initial={
								reduce
									? { opacity: 0 }
									: { opacity: 0, y: -4, filter: "blur(4px)" }
							}
							animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
							exit={
								reduce
									? { opacity: 0 }
									: { opacity: 0, y: -4, filter: "blur(4px)" }
							}
							transition={{ duration: 0.2 }}
							className={cn(
								"px-1 text-xs text-destructive",
								classNames?.errorMessage,
							)}
						>
							{errorMessage}
						</motion.p>
					) : null}
				</AnimatePresence>
			</div>
		</div>
	);
});

/** Multiline field using the registry Input's focus, validation and motion language. */
export const Textarea = forwardRef<
	HTMLTextAreaElement,
	Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> & {
		onChange?: (value: string) => void;
		error?: string | boolean;
		label?: string;
		size?: "default" | "compact";
		appearance?: "default" | "editor";
		classNames?: Pick<
			InputClassNames,
			"root" | "field" | "input" | "label" | "errorMessage"
		>;
	}
>(function Textarea(
	{
		onChange,
		error,
		label,
		id: idProp,
		className,
		classNames,
		size = "default",
		appearance = "default",
		...props
	},
	ref,
) {
	const generatedId = useId();
	const id = idProp ?? generatedId;
	const reduce = useReducedMotion();
	const field = useRef<HTMLDivElement>(null);
	const hasError =
		Boolean(error) ||
		props["aria-invalid"] === true ||
		props["aria-invalid"] === "true";
	useEffect(() => {
		if (!field.current || reduce || !hasError) return;
		const animation = animate(
			field.current,
			{ x: [0, -6, 6, -4, 4, -2, 0] },
			{ duration: 0.45 },
		);
		return () => animation.stop();
	}, [hasError, reduce]);
	return (
		<div
			data-beui="textarea"
			className={cn("flex min-w-0 flex-col gap-1.5", classNames?.root)}
		>
			{label ? (
				<label
					htmlFor={id}
					className={cn(
						"px-1 text-sm font-medium text-foreground",
						classNames?.label,
					)}
				>
					{label}
				</label>
			) : null}
			<div
				ref={field}
				className={cn(
					"overflow-hidden rounded-2xl border border-input transition-colors duration-200 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40",
					appearance === "editor" &&
						"rounded-md border-transparent hover:border-border hover:bg-muted/40",
					hasError && "border-destructive ring-2 ring-destructive/25",
					classNames?.field,
				)}
			>
				<textarea
					{...props}
					ref={ref}
					id={id}
					aria-invalid={hasError || props["aria-invalid"]}
					aria-describedby={
						cn(
							props["aria-describedby"],
							typeof error === "string" && error && `${id}-error`,
						) || undefined
					}
					onChange={(event) => onChange?.(event.target.value)}
					className={cn(
						"block w-full resize-y bg-transparent px-3.5 text-base leading-6 text-foreground caret-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60",
						size === "compact" ? "min-h-11 py-2.5" : "min-h-24 py-3",
						appearance === "editor" &&
							"min-h-9 px-2 py-1.5 text-sm max-sm:min-h-11 max-sm:py-2.5 max-sm:text-base pointer-coarse:min-h-11 pointer-coarse:text-base",
						className,
						classNames?.input,
					)}
				/>
			</div>
			<AnimatePresence initial={false}>
				{typeof error === "string" && error ? (
					<motion.p
						id={`${id}-error`}
						role="alert"
						initial={
							reduce
								? { opacity: 0 }
								: { opacity: 0, y: -4, filter: "blur(4px)" }
						}
						animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
						exit={
							reduce
								? { opacity: 0 }
								: { opacity: 0, y: -4, filter: "blur(4px)" }
						}
						transition={{ duration: 0.2 }}
						className={cn(
							"px-1 text-xs text-destructive",
							classNames?.errorMessage,
						)}
					>
						{error}
					</motion.p>
				) : null}
			</AnimatePresence>
		</div>
	);
});
