import type * as React from "react";
import { cn } from "../../lib/utils";

export type SurfaceSize = "default" | "sm";

/**
 * Shared beUI content surface for product pages that need a bounded region.
 * It carries only layout and design tokens; interactions stay with the
 * dedicated beUI controls composed inside it.
 */
export function Surface({
	className,
	size = "default",
	...props
}: React.ComponentProps<"section"> & { size?: SurfaceSize }) {
	return (
		<section
			data-beui="surface"
			data-size={size}
			className={cn(
				"group/surface flex min-w-0 flex-col gap-(--surface-spacing) overflow-hidden rounded-2xl bg-card py-(--surface-spacing) text-sm text-card-foreground ring-1 ring-foreground/8 [--surface-spacing:--spacing(4)] has-data-[beui=surface-footer]:pb-0 data-[size=sm]:[--surface-spacing:--spacing(3)]",
				className,
			)}
			{...props}
		/>
	);
}

export function SurfaceHeader({
	className,
	...props
}: React.ComponentProps<"header">) {
	return (
		<header
			data-beui="surface-header"
			className={cn(
				"@container/surface-header grid auto-rows-min items-start gap-1 px-(--surface-spacing) has-data-[beui=surface-action]:grid-cols-[minmax(0,1fr)_auto] has-data-[beui=surface-description]:grid-rows-[auto_auto] [.border-b]:pb-(--surface-spacing)",
				className,
			)}
			{...props}
		/>
	);
}

export function SurfaceTitle({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			data-beui="surface-title"
			className={cn(
				"font-heading text-base font-medium leading-snug group-data-[size=sm]/surface:text-sm",
				className,
			)}
			{...props}
		/>
	);
}

export function SurfaceDescription({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			data-beui="surface-description"
			className={cn("text-sm text-muted-foreground", className)}
			{...props}
		/>
	);
}

export function SurfaceAction({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			data-beui="surface-action"
			className={cn(
				"col-start-2 row-span-2 row-start-1 self-start justify-self-end",
				className,
			)}
			{...props}
		/>
	);
}

export function SurfaceContent({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			data-beui="surface-content"
			className={cn("min-w-0 px-(--surface-spacing)", className)}
			{...props}
		/>
	);
}

export function SurfaceFooter({
	className,
	...props
}: React.ComponentProps<"footer">) {
	return (
		<footer
			data-beui="surface-footer"
			className={cn(
				"flex items-center border-t bg-muted/25 p-(--surface-spacing)",
				className,
			)}
			{...props}
		/>
	);
}

export const appPanelSurfaceClassName =
	"overflow-hidden bg-card shadow-sm shadow-black/5 ring-1 ring-foreground/8";
