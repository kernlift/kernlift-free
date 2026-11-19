"use client";

import type { HTMLMotionProps } from "motion/react";
import { motion } from "motion/react";
import { forwardRef } from "react";
import { SPRING_PRESS } from "../../lib/ease";
import { useReducedMotionPreference } from "../../lib/hooks/use-reduced-motion-preference";
import { cn } from "../../lib/utils";

export type TextLinkProps = HTMLMotionProps<"a">;

/** Inline beUI navigation with shared focus, pointer, press and Reduced Motion behavior. */
export const TextLink = forwardRef<HTMLAnchorElement, TextLinkProps>(
	function TextLink({ className, children, ...props }, ref) {
		const reduce = useReducedMotionPreference();
		return (
			<motion.a
				data-beui="text-link"
				ref={ref}
				whileTap={reduce ? undefined : { opacity: 0.68 }}
				transition={SPRING_PRESS}
				className={cn(
					"cursor-pointer rounded-sm font-medium text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors hover:decoration-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
					className,
				)}
				{...props}
			>
				{children}
			</motion.a>
		);
	},
);

TextLink.displayName = "TextLink";
