"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";

import { cn } from "@/lib/utils";

const THEMES = { dark: ".dark", light: "" } as const;

export type ChartConfig = {
	[key: string]: {
		color?: string;
		icon?: React.ComponentType;
		label?: React.ReactNode;
		theme?: Record<keyof typeof THEMES, string>;
	};
};

type ChartContextProps = {
	config: ChartConfig;
};

type ChartPayloadItem = {
	color?: string;
	dataKey?: number | string;
	name?: number | string;
	payload?: Record<string, unknown>;
	value?: number | string;
	[key: string]: unknown;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
	const context = React.useContext(ChartContext);

	if (!context) {
		throw new Error("useChart must be used within a <ChartContainer />");
	}

	return context;
}

function ChartContainer({
	children,
	className,
	config,
	id,
	staticSize,
	...props
}: React.ComponentProps<"div"> & {
	children: React.ComponentProps<
		typeof RechartsPrimitive.ResponsiveContainer
	>["children"];
	config: ChartConfig;
	staticSize?: { height: number; width: number };
}) {
	const uniqueId = React.useId();
	const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

	return (
		<ChartContext.Provider value={{ config }}>
			<div
				className={cn(
					"flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border/40 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
					className,
				)}
				data-chart={chartId}
				data-slot="chart"
				{...props}
			>
				<ChartStyle config={config} id={chartId} />
				{staticSize && React.isValidElement(children) ? (
					React.cloneElement(
						children as React.ReactElement<{ height?: number; width?: number }>,
						staticSize,
					)
				) : (
					<RechartsPrimitive.ResponsiveContainer
						initialDimension={{ height: 1, width: 1 }}
						minHeight={0}
						minWidth={0}
					>
						{children}
					</RechartsPrimitive.ResponsiveContainer>
				)}
			</div>
		</ChartContext.Provider>
	);
}

const ChartStyle = ({ config, id }: { config: ChartConfig; id: string }) => {
	const colorConfig = Object.entries(config).filter(
		([, itemConfig]) => itemConfig.theme || itemConfig.color,
	);

	if (!colorConfig.length) {
		return null;
	}

	return (
		<style
			// biome-ignore lint/security/noDangerouslySetInnerHtml: chart series need scoped CSS variables.
			dangerouslySetInnerHTML={{
				__html: Object.entries(THEMES)
					.map(
						([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
	.map(([key, itemConfig]) => {
		const color =
			itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
			itemConfig.color;
		return color ? `  --color-${key}: ${color};` : null;
	})
	.join("\n")}
}
`,
					)
					.join("\n"),
			}}
		/>
	);
};

const ChartTooltip = RechartsPrimitive.Tooltip;
const ChartLegend = RechartsPrimitive.Legend;

function ChartTooltipContent({
	active,
	className,
	formatter,
	hideIndicator = false,
	hideLabel = false,
	indicator = "dot",
	label,
	labelClassName,
	labelFormatter,
	labelKey,
	nameKey,
	payload,
}: React.ComponentProps<"div"> & {
	active?: boolean;
	formatter?: (
		value: number | string,
		name: number | string,
		item: ChartPayloadItem,
		index: number,
		payload: ChartPayloadItem["payload"],
	) => React.ReactNode;
	hideIndicator?: boolean;
	hideLabel?: boolean;
	indicator?: "dot" | "line" | "dashed";
	label?: React.ReactNode;
	labelClassName?: string;
	labelFormatter?: (
		label: React.ReactNode,
		payload: ChartPayloadItem[],
	) => React.ReactNode;
	labelKey?: string;
	nameKey?: string;
	payload?: ChartPayloadItem[];
}) {
	const { config } = useChart();

	const tooltipLabel = React.useMemo(() => {
		if (hideLabel || !payload?.length) {
			return null;
		}

		const [item] = payload;
		const key = `${labelKey || item?.dataKey || item?.name || "value"}`;
		const itemConfig = getPayloadConfigFromPayload(config, item, key);
		const value =
			!labelKey && typeof label === "string"
				? config[label as keyof typeof config]?.label || label
				: itemConfig?.label;

		if (labelFormatter) {
			return (
				<div className={cn("font-medium", labelClassName)}>
					{labelFormatter(value, payload)}
				</div>
			);
		}

		if (!value) {
			return null;
		}

		return <div className={cn("font-medium", labelClassName)}>{value}</div>;
	}, [
		config,
		hideLabel,
		label,
		labelClassName,
		labelFormatter,
		labelKey,
		payload,
	]);

	if (!active || !payload?.length) {
		return null;
	}

	const nestLabel = payload.length === 1 && indicator !== "dot";

	return (
		<div
			className={cn(
				"grid min-w-[8rem] items-start gap-1.5 rounded-md border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-xl",
				className,
			)}
		>
			{!nestLabel ? tooltipLabel : null}
			<div className="grid gap-1.5">
				{payload.map((item, index) => {
					const key = `${nameKey || item.name || item.dataKey || "value"}`;
					const itemConfig = getPayloadConfigFromPayload(config, item, key);
					const indicatorColor =
						item.color || item.payload?.fill || item.payload?.color;

					return (
						<div
							className={cn(
								"flex w-full flex-wrap items-stretch gap-2 [&>svg]:size-2.5 [&>svg]:text-muted-foreground",
								indicator === "dot" && "items-center",
							)}
							key={`${item.dataKey || item.name || "value"}-${item.color || item.value || ""}`}
						>
							{formatter && item?.value !== undefined && item.name ? (
								formatter(item.value, item.name, item, index, item.payload)
							) : (
								<>
									{itemConfig?.icon ? (
										<itemConfig.icon />
									) : (
										!hideIndicator && (
											<div
												className={cn(
													"shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)",
													{
														"h-2.5 w-2.5": indicator === "dot",
														"w-1": indicator === "line",
														"w-0 border-[1.5px] border-dashed bg-transparent":
															indicator === "dashed",
														"my-0.5": nestLabel && indicator === "dashed",
													},
												)}
												style={
													{
														"--color-bg": indicatorColor,
														"--color-border": indicatorColor,
													} as React.CSSProperties
												}
											/>
										)
									)}
									<div
										className={cn(
											"flex flex-1 justify-between leading-none",
											nestLabel ? "items-end" : "items-center",
										)}
									>
										<div className="grid gap-1.5">
											{nestLabel ? tooltipLabel : null}
											<span className="text-muted-foreground">
												{itemConfig?.label || item.name}
											</span>
										</div>
										{item.value !== undefined && item.value !== null ? (
											<span className="font-mono font-medium tabular-nums text-foreground">
												{item.value.toLocaleString()}
											</span>
										) : null}
									</div>
								</>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}

function ChartLegendContent({
	className,
	hideIcon = false,
	nameKey,
	payload,
	verticalAlign = "bottom",
}: React.ComponentProps<"div"> & {
	hideIcon?: boolean;
	nameKey?: string;
	payload?: Array<ChartPayloadItem & { color?: string; value?: string }>;
	verticalAlign?: "bottom" | "middle" | "top";
}) {
	const { config } = useChart();

	if (!payload?.length) {
		return null;
	}

	return (
		<div
			className={cn(
				"flex items-center justify-center gap-4",
				verticalAlign === "top" ? "pb-3" : "pt-3",
				className,
			)}
		>
			{payload.map((item) => {
				const key = `${nameKey || item.dataKey || "value"}`;
				const itemConfig = getPayloadConfigFromPayload(config, item, key);

				return (
					<div
						className="flex items-center gap-1.5 [&>svg]:size-3 [&>svg]:text-muted-foreground"
						key={item.value}
					>
						{itemConfig?.icon && !hideIcon ? (
							<itemConfig.icon />
						) : (
							<div
								className="size-2 shrink-0 rounded-[2px]"
								style={{
									backgroundColor: item.color,
								}}
							/>
						)}
						{itemConfig?.label}
					</div>
				);
			})}
		</div>
	);
}

function getPayloadConfigFromPayload(
	config: ChartConfig,
	payload: unknown,
	key: string,
) {
	if (typeof payload !== "object" || payload === null) {
		return undefined;
	}

	const payloadPayload =
		"payload" in payload &&
		typeof payload.payload === "object" &&
		payload.payload !== null
			? payload.payload
			: undefined;

	let configLabelKey = key;

	if (
		key in payload &&
		typeof payload[key as keyof typeof payload] === "string"
	) {
		configLabelKey = payload[key as keyof typeof payload] as string;
	} else if (
		payloadPayload &&
		key in payloadPayload &&
		typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
	) {
		configLabelKey = payloadPayload[
			key as keyof typeof payloadPayload
		] as string;
	}

	return configLabelKey in config
		? config[configLabelKey]
		: config[key as keyof typeof config];
}

export {
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartStyle,
	ChartTooltip,
	ChartTooltipContent,
};
