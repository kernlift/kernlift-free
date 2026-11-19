import { type ReactNode, useId } from "react";
import {
	Surface,
	SurfaceAction,
	SurfaceContent,
	SurfaceHeader,
	SurfaceTitle,
} from "@/components/motion/surface";

/** Shared beUI detail composition: named panels and readable facts without nested cards. */
export function AdminPanel({
	title,
	actions,
	children,
}: {
	title: string;
	actions?: ReactNode;
	children: ReactNode;
}) {
	const id = useId();
	return (
		<Surface aria-labelledby={id} className="rounded-xl" data-admin-panel>
			<SurfaceHeader className="border-b border-border/70 sm:px-5">
				<SurfaceTitle id={id} role="heading" aria-level={2}>
					{title}
				</SurfaceTitle>
				{actions ? <SurfaceAction>{actions}</SurfaceAction> : null}
			</SurfaceHeader>
			<SurfaceContent className="@container grid min-w-0 gap-5 sm:px-5">
				{children}
			</SurfaceContent>
		</Surface>
	);
}
export function AdminFacts({
	items,
	columns = 2,
}: {
	items: Array<{ label: string; value: ReactNode }>;
	columns?: 2 | 3;
}) {
	return (
		<dl
			className={`m-0 grid min-w-0 gap-x-6 gap-y-4 @min-[32rem]:grid-cols-2 ${columns === 3 ? "@min-[48rem]:grid-cols-3" : ""}`}
		>
			{items.map(({ label, value }) => (
				<div key={label} className="grid min-w-0 content-start gap-1">
					<dt className="text-xs text-muted-foreground">{label}</dt>
					<dd className="m-0 whitespace-normal text-sm leading-6 tabular-nums [overflow-wrap:anywhere]">
						{value}
					</dd>
				</div>
			))}
		</dl>
	);
}
