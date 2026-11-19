import type { ReactNode } from "react";
import { StatusTag } from "@/components/motion/status-tag";
import type { StatusTone } from "./types";

export function StatusToneBadge({
	children,
	tone,
}: {
	children: ReactNode;
	tone: StatusTone;
}) {
	return <StatusTag tone={tone}>{children}</StatusTag>;
}
