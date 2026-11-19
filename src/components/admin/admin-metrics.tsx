import { Surface } from "@/components/motion/surface";

/** Compact metric group; details are reserved for distinct business information. */
export function AdminMetrics({
	items,
}: {
	items: Array<{ label: string; value: string; detail?: string }>;
}) {
	return (
		<Surface size="sm" className="rounded-xl py-0" data-admin-metrics>
			<dl
				className={`m-0 grid grid-cols-1 gap-px bg-border/60 ${items.length > 1 ? "min-[360px]:grid-cols-2" : ""} ${items.length === 3 ? "lg:grid-cols-3" : items.length >= 4 ? "lg:grid-cols-4" : ""}`}
			>
				{items.map((item) => (
					<div
						key={item.label}
						className="grid min-w-0 content-start gap-2 bg-card p-4 sm:p-5"
					>
						<dt className="text-xs font-medium leading-5 text-muted-foreground">
							{item.label}
						</dt>
						<dd className="m-0 break-words text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
							{item.value}
						</dd>
						{item.detail ? (
							<dd className="m-0 break-words text-xs text-muted-foreground">
								{item.detail}
							</dd>
						) : null}
					</div>
				))}
			</dl>
		</Surface>
	);
}
