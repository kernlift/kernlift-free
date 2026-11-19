import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";
import { SPRING_LAYOUT } from "../../lib/ease";
import { useReducedMotionPreference as useReducedMotion } from "../../lib/hooks/use-reduced-motion-preference";
import { cn } from "../../lib/utils";

export type EmptyStateVariant = "archive" | "search" | "inbox" | "board";

type EmptyStateProps = {
	title: string;
	description: string;
	action?: ReactNode;
	/** Illustration style: archive (no data), search (no results), inbox (all clear), board (first run). */
	variant?: EmptyStateVariant;
	className?: string;
};

const drawerVariants: Variants = {
	idle: { x: 0 },
	hover: { x: 10, transition: SPRING_LAYOUT },
};

function ArchiveIllustration({ reduce }: { reduce: boolean }) {
	return (
		<svg
			aria-hidden="true"
			className="text-muted-foreground"
			fill="none"
			height="96"
			viewBox="0 0 132 96"
			width="132"
		>
			<rect
				height="64"
				rx="6"
				stroke="currentColor"
				strokeWidth="1.5"
				width="56"
				x="38"
				y="16"
			/>
			<line
				stroke="currentColor"
				strokeWidth="1.5"
				x1="38"
				x2="94"
				y1="38"
				y2="38"
			/>
			<line
				stroke="currentColor"
				strokeWidth="1.5"
				x1="38"
				x2="94"
				y1="58"
				y2="58"
			/>
			<rect
				height="3"
				rx="1.5"
				fill="currentColor"
				opacity="0.5"
				width="12"
				x="60"
				y="46"
			/>
			<rect
				height="3"
				rx="1.5"
				fill="currentColor"
				opacity="0.5"
				width="12"
				x="60"
				y="66"
			/>
			<motion.g variants={reduce ? undefined : drawerVariants}>
				<rect
					fill="var(--background)"
					height="16"
					rx="3"
					stroke="currentColor"
					strokeWidth="1.5"
					width="60"
					x="42"
					y="20"
				/>
				<rect
					fill="currentColor"
					height="3"
					rx="1.5"
					width="12"
					x="66"
					y="26.5"
				/>
			</motion.g>
		</svg>
	);
}

const lensVariants: Variants = {
	idle: { x: 0, y: 0 },
	hover: { x: 26, y: 8, transition: SPRING_LAYOUT },
};

function SearchIllustration({ reduce }: { reduce: boolean }) {
	return (
		<svg
			aria-hidden="true"
			className="text-muted-foreground"
			fill="none"
			height="96"
			viewBox="0 0 132 96"
			width="132"
		>
			<rect
				height="4"
				opacity="0.45"
				rx="2"
				fill="currentColor"
				width="56"
				x="38"
				y="30"
			/>
			<rect
				height="4"
				opacity="0.45"
				rx="2"
				fill="currentColor"
				width="42"
				x="38"
				y="46"
			/>
			<rect
				height="4"
				opacity="0.45"
				rx="2"
				fill="currentColor"
				width="50"
				x="38"
				y="62"
			/>
			<motion.g variants={reduce ? undefined : lensVariants}>
				<circle
					cx="56"
					cy="44"
					fill="var(--background)"
					fillOpacity="0.75"
					r="14"
					stroke="currentColor"
					strokeWidth="1.8"
				/>
				<line
					stroke="currentColor"
					strokeLinecap="round"
					strokeWidth="1.8"
					x1="66"
					x2="75"
					y1="54"
					y2="63"
				/>
			</motion.g>
		</svg>
	);
}

const flapVariants: Variants = {
	idle: { scaleY: 1 },
	hover: { scaleY: -0.85, transition: SPRING_LAYOUT },
};

const letterVariants: Variants = {
	idle: { y: 0, opacity: 0 },
	hover: { y: -14, opacity: 1, transition: SPRING_LAYOUT },
};

function InboxIllustration({ reduce }: { reduce: boolean }) {
	return (
		<svg
			aria-hidden="true"
			className="text-muted-foreground"
			fill="none"
			height="96"
			viewBox="0 0 132 96"
			width="132"
		>
			<motion.g
				style={{ originY: "44px" }}
				variants={reduce ? undefined : letterVariants}
			>
				<rect
					fill="var(--background)"
					height="26"
					rx="3"
					stroke="currentColor"
					strokeWidth="1.5"
					width="36"
					x="48"
					y="34"
				/>
				<line
					opacity="0.5"
					stroke="currentColor"
					strokeWidth="1.5"
					x1="54"
					x2="78"
					y1="42"
					y2="42"
				/>
				<line
					opacity="0.5"
					stroke="currentColor"
					strokeWidth="1.5"
					x1="54"
					x2="70"
					y1="48"
					y2="48"
				/>
			</motion.g>
			<path
				d="M40 46l24 16 24-16v26a4 4 0 0 1-4 4H44a4 4 0 0 1-4-4V46Z"
				fill="var(--background)"
				stroke="currentColor"
				strokeLinejoin="round"
				strokeWidth="1.5"
			/>
			<motion.path
				d="M40 46l24-14 24 14"
				stroke="currentColor"
				strokeLinejoin="round"
				strokeWidth="1.5"
				style={{ originY: "46px", originX: "64px" }}
				variants={reduce ? undefined : flapVariants}
			/>
		</svg>
	);
}

const cardVariants: Variants = {
	idle: { x: 0 },
	hover: { x: 30, transition: SPRING_LAYOUT },
};

const cursorVariants: Variants = {
	idle: { x: 0, y: 0 },
	hover: { x: 30, y: 4, transition: { ...SPRING_LAYOUT, delay: 0.04 } },
};

function BoardIllustration({ reduce }: { reduce: boolean }) {
	return (
		<svg
			aria-hidden="true"
			className="text-muted-foreground"
			fill="none"
			height="96"
			viewBox="0 0 132 96"
			width="132"
		>
			{[28, 58, 88].map((x) => (
				<rect
					height="56"
					key={x}
					opacity="0.6"
					rx="5"
					stroke="currentColor"
					strokeDasharray="4 4"
					strokeWidth="1.3"
					width="24"
					x={x}
					y="20"
				/>
			))}
			<motion.rect
				fill="var(--background)"
				height="14"
				rx="3"
				stroke="currentColor"
				strokeWidth="1.5"
				variants={reduce ? undefined : cardVariants}
				width="18"
				x="31"
				y="24"
			/>
			<motion.path
				d="M52 60l4.2 10 1.9-4.2 4.4-1.4L52 60Z"
				fill="currentColor"
				variants={reduce ? undefined : cursorVariants}
			/>
		</svg>
	);
}

const ILLUSTRATIONS: Record<
	EmptyStateVariant,
	(props: { reduce: boolean }) => ReactNode
> = {
	archive: ArchiveIllustration,
	search: SearchIllustration,
	inbox: InboxIllustration,
	board: BoardIllustration,
};

export function EmptyState({
	title,
	description,
	action,
	variant = "archive",
	className,
}: EmptyStateProps) {
	const reduce = useReducedMotion() ?? false;
	const Illustration = ILLUSTRATIONS[variant];

	return (
		<motion.div
			animate="idle"
			className={cn(
				"flex flex-col items-center justify-center gap-1.5 rounded-2xl px-6 py-12 text-center",
				className,
			)}
			data-beui
			initial="idle"
			whileHover={reduce ? undefined : "hover"}
		>
			<Illustration reduce={reduce} />
			<h2 className="mt-2 text-base font-semibold text-foreground">{title}</h2>
			<p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
				{description}
			</p>
			{action ? <div className="mt-3">{action}</div> : null}
		</motion.div>
	);
}
