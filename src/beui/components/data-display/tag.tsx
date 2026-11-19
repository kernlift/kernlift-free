import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

export const tagVariants = cva(
	"group/tag inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-full border px-2.5 text-xs font-medium leading-none transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 [&>svg]:pointer-events-none [&>svg]:size-4",
	{
		variants: {
			variant: {
				default: "border-transparent bg-primary text-primary-foreground",
				secondary: "border-border/70 bg-muted/65 text-foreground",
				destructive:
					"border-[var(--failure-border)] bg-[var(--failure-wash)] text-[var(--failure-red)]",
				outline: "border-border bg-card text-muted-foreground",
				ghost: "border-transparent bg-transparent text-muted-foreground",
				link: "border-transparent bg-transparent px-0 text-foreground underline-offset-4 hover:underline",
			},
		},
		defaultVariants: {
			variant: "secondary",
		},
	},
);

export function Tag({
	className,
	variant = "secondary",
	render,
	...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof tagVariants>) {
	return useRender({
		defaultTagName: "span",
		props: mergeProps<"span">(
			{
				className: cn(tagVariants({ variant }), className),
			},
			props,
		),
		render,
		state: {
			slot: "tag",
			variant,
		},
	});
}
