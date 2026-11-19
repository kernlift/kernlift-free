import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** One wrapping row sized by available space, without shrinking controls below usable widths. */
export function AdminFilterBar({ className, ...props }: ComponentProps<"div">) {
	return (
		<div
			{...props}
			data-admin-filter-bar
			className={cn(
				"flex min-w-0 flex-wrap items-end gap-3 [&>*]:min-w-0 [&>*]:flex-[1_1_12rem]",
				className,
			)}
		/>
	);
}
