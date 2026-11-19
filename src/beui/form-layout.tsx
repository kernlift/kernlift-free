import type {
	ComponentProps,
	FieldsetHTMLAttributes,
	HTMLAttributes,
	LabelHTMLAttributes,
	ReactNode,
} from "react";
import { cn } from "./lib/utils";

// Static form composition around beUI controls. These own spacing and semantic
// labels only; input, selection, validation and motion stay in the controls.
export function FormStack({
	className,
	...props
}: HTMLAttributes<HTMLDivElement>) {
	return (
		<div className={cn("flex min-w-0 flex-col gap-4", className)} {...props} />
	);
}

export function FormField({
	className,
	orientation = "vertical",
	...props
}: HTMLAttributes<HTMLDivElement> & {
	orientation?: "vertical" | "horizontal" | "responsive";
}) {
	return (
		<div
			className={cn(
				"min-w-0 gap-2",
				orientation === "horizontal"
					? "flex items-center justify-between"
					: orientation === "responsive"
						? "grid grid-cols-2 items-center gap-3"
						: "flex flex-col",
				className,
			)}
			{...props}
		/>
	);
}

export function FormLabel({
	className,
	htmlFor,
	...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
	const classes = cn(
		"text-sm font-medium leading-relaxed text-foreground",
		className,
	);
	return htmlFor ? (
		// biome-ignore lint/a11y/noLabelWithoutControl: The caller provides the associated control and id.
		<label htmlFor={htmlFor} className={classes} {...props} />
	) : (
		<span className={classes} {...props} />
	);
}

export function FormHint({
	className,
	...props
}: HTMLAttributes<HTMLParagraphElement>) {
	return (
		<p
			className={cn(
				"m-0 text-xs leading-relaxed text-muted-foreground",
				className,
			)}
			{...props}
		/>
	);
}

export function FormError({
	className,
	...props
}: HTMLAttributes<HTMLParagraphElement>) {
	return (
		<p
			role="alert"
			className={cn("m-0 text-xs leading-relaxed text-destructive", className)}
			{...props}
		/>
	);
}

export function FormDivider({
	className,
	...props
}: HTMLAttributes<HTMLHRElement>) {
	return (
		<hr
			className={cn("m-0 border-0 border-t border-border", className)}
			{...props}
		/>
	);
}

export function FieldSet({
	className,
	...props
}: FieldsetHTMLAttributes<HTMLFieldSetElement>) {
	return (
		<fieldset
			className={cn("flex min-w-0 flex-col gap-4", className)}
			{...props}
		/>
	);
}

export function FieldLegend({
	className,
	variant = "legend",
	...props
}: ComponentProps<"legend"> & { variant?: "legend" | "label" }) {
	return (
		<legend
			className={cn(
				"mb-1.5 font-medium text-foreground",
				variant === "label" ? "text-sm" : "text-base",
				className,
			)}
			data-variant={variant}
			{...props}
		/>
	);
}

export function FieldGroup({
	className,
	...props
}: HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn("flex min-w-0 w-full flex-col gap-5", className)}
			{...props}
		/>
	);
}

export function Field({
	className,
	orientation = "vertical",
	...props
}: HTMLAttributes<HTMLDivElement> & {
	orientation?: "vertical" | "horizontal" | "responsive";
}) {
	return (
		<div
			className={cn(
				"group/field flex min-w-0 w-full gap-2 data-[invalid=true]:text-destructive",
				orientation === "horizontal"
					? "flex-row items-center justify-between"
					: orientation === "responsive"
						? "flex-col @md/field-group:flex-row @md/field-group:items-center"
						: "flex-col",
				className,
			)}
			data-orientation={orientation}
			{...props}
		/>
	);
}

export function FieldContent({
	className,
	...props
}: HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				"flex min-w-0 flex-1 flex-col gap-0.5 leading-snug",
				className,
			)}
			{...props}
		/>
	);
}

export function FieldLabel({
	className,
	...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
	return (
		// biome-ignore lint/a11y/noLabelWithoutControl: The caller supplies htmlFor or nests the control.
		<label
			className={cn(
				"flex w-fit items-center gap-2 text-sm font-medium leading-snug text-foreground select-none group-data-[disabled=true]/field:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
				className,
			)}
			{...props}
		/>
	);
}

export function FieldTitle({
	className,
	...props
}: HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				"flex w-fit items-center gap-2 text-sm font-medium text-foreground group-data-[disabled=true]/field:opacity-50",
				className,
			)}
			{...props}
		/>
	);
}

export function FieldDescription({ className, ...props }: ComponentProps<"p">) {
	return (
		<p
			className={cn(
				"m-0 text-left text-sm font-normal leading-normal text-muted-foreground",
				className,
			)}
			{...props}
		/>
	);
}

export function FieldError({
	className,
	children,
	errors,
	...props
}: ComponentProps<"div"> & {
	errors?: Array<{ message?: string } | undefined>;
}) {
	const uniqueMessages = Array.from(
		new Set(
			errors?.flatMap((error) => (error?.message ? [error.message] : [])) ?? [],
		),
	);
	const content: ReactNode =
		children ??
		(uniqueMessages.length > 1 ? (
			<ul className="ml-4 flex list-disc flex-col gap-1">
				{uniqueMessages.map((message) => (
					<li key={message}>{message}</li>
				))}
			</ul>
		) : (
			uniqueMessages[0]
		));

	if (!content) return null;
	return (
		<div
			className={cn("text-sm font-normal text-destructive", className)}
			role="alert"
			{...props}
		>
			{content}
		</div>
	);
}
