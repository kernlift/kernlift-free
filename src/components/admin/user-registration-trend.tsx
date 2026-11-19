import { useId } from "react";
import { Area, ComposedChart, Line, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/data-display/chart";
import { getMessageNamespace, type Locale } from "@/i18n/messages";
import type { UserDashboardTrendPoint } from "@/server/functions/user-dashboard";

/** The directory doesn't load this chart until Insights is first opened. */
export default function UserRegistrationTrend({
	rows,
	locale,
}: {
	rows: UserDashboardTrendPoint[];
	locale: Locale;
}) {
	const copy = getMessageNamespace(locale, "userDashboardCopy");
	const gradient = `user-registration-${useId().replace(/:/g, "")}`;
	const number = new Intl.NumberFormat(locale);
	return (
		<ChartContainer
			className="h-56 w-full min-w-0"
			role="img"
			aria-label={copy.trendDetail}
			config={{
				today: { label: copy.todayLegend, color: "var(--chart-1)" },
				yesterday: {
					label: copy.previousPeriod,
					color: "var(--muted-foreground)",
				},
			}}
		>
			<ComposedChart
				data={rows}
				accessibilityLayer
				margin={{ top: 10, right: 12, bottom: 5, left: 0 }}
			>
				<defs>
					<linearGradient id={gradient} x1="0" x2="0" y1="0" y2="1">
						<stop
							offset="0%"
							stopColor="var(--color-today)"
							stopOpacity={0.3}
						/>
						<stop
							offset="52%"
							stopColor="var(--color-today)"
							stopOpacity={0.13}
						/>
						<stop
							offset="100%"
							stopColor="var(--color-today)"
							stopOpacity={0}
						/>
					</linearGradient>
				</defs>
				<XAxis
					dataKey="label"
					minTickGap={28}
					tickLine={false}
					axisLine={false}
				/>
				<YAxis
					allowDecimals={false}
					width={36}
					tickLine={false}
					axisLine={false}
				/>
				<ChartTooltip
					cursor={false}
					formatter={(value, name) => [number.format(Number(value)), name]}
				/>
				<Area
					dataKey="today"
					name={copy.todayLegend}
					type="bump"
					stroke="var(--color-today)"
					strokeWidth={2.35}
					strokeLinecap="round"
					strokeLinejoin="round"
					fill={`url(#${gradient})`}
					fillOpacity={0.78}
					dot={rows.length === 1}
					isAnimationActive={false}
				/>
				<Line
					dataKey="yesterday"
					name={copy.previousPeriod}
					type="bump"
					stroke="var(--color-yesterday)"
					strokeDasharray="4 4"
					strokeWidth={2}
					strokeLinecap="round"
					dot={rows.length === 1}
					isAnimationActive={false}
				/>
			</ComposedChart>
		</ChartContainer>
	);
}
