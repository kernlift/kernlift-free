import { FormLabel } from "@/beui/form-layout";
import { type ComponentProps, type ReactNode, useId } from "react";
import { Input, Textarea } from "@/components/motion/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "@/components/motion/select";
import {
	appPanelSurfaceClassName,
	Surface,
	SurfaceContent,
	SurfaceDescription,
	SurfaceHeader,
	SurfaceTitle,
} from "@/components/motion/surface";
import { Switch } from "@/components/motion/switch";
import { cn } from "@/lib/utils";
import { AdminRecords } from "./admin-records";

function ConfigShell({ children }: { children: ReactNode }) {
	return <div className="@container grid w-full min-w-0 gap-6">{children}</div>;
}

/** Paired panels share header/content rows so their borders and content starts align. */
function ConfigPanelGrid({ children }: { children: ReactNode }) {
	return (
		<div className="grid min-w-0 gap-4 xl:grid-cols-2 xl:[&>[data-beui=surface]]:row-span-2 xl:[&>[data-beui=surface]]:grid xl:[&>[data-beui=surface]]:grid-rows-subgrid">
			{children}
		</div>
	);
}

function ConfigPanel({
	children,
	description,
	title,
}: {
	children: ReactNode;
	description?: ReactNode;
	title: ReactNode;
}) {
	const titleId = useId();
	return (
		<Surface
			className={cn(appPanelSurfaceClassName, "rounded-xl shadow-none")}
			aria-labelledby={titleId}
		>
			<SurfaceHeader className="border-b border-border/70 sm:px-5">
				<SurfaceTitle id={titleId} role="heading" aria-level={2}>
					{title}
				</SurfaceTitle>
				{description ? (
					<SurfaceDescription className="max-w-prose leading-6">
						{description}
					</SurfaceDescription>
				) : null}
			</SurfaceHeader>
			<SurfaceContent className="@container grid min-w-0 content-start gap-5 py-2 sm:px-5">
				{children}
			</SurfaceContent>
		</Surface>
	);
}

function ConfigFormFields({
	children,
	compact = false,
}: {
	children: ReactNode;
	compact?: boolean;
}) {
	return (
		<div
			className={cn(
				"grid min-w-0 gap-x-5 gap-y-6",
				compact
					? "items-end @min-[18rem]:grid-cols-2"
					: "items-start @min-[32rem]:grid-cols-2",
			)}
		>
			{children}
		</div>
	);
}

function ConfigField({
	label,
	fullWidth = false,
	...props
}: Omit<ComponentProps<typeof Input>, "label"> & {
	label: ReactNode;
	fullWidth?: boolean;
}) {
	const generatedId = useId();
	const controlId = props.id ?? generatedId;
	return (
		<div className={`grid min-w-0 gap-1.5${fullWidth ? " col-span-full" : ""}`}>
			<FormLabel htmlFor={controlId}>{label}</FormLabel>
			<Input
				{...props}
				id={controlId}
				classNames={{
					...props.classNames,
					field: cn("rounded-lg bg-background/50", props.classNames?.field),
				}}
			/>
		</div>
	);
}

function ConfigSwitch({
	label,
	...props
}: Omit<ComponentProps<typeof Switch>, "label"> & {
	label: ReactNode;
}) {
	const generatedId = useId();
	const controlId = props.id ?? generatedId;
	return (
		<div className="flex min-h-14 min-w-0 items-center justify-between gap-4 rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
			<FormLabel
				className="min-w-0 flex-1 text-sm font-medium leading-5"
				htmlFor={controlId}
			>
				{label}
			</FormLabel>
			<Switch {...props} id={controlId} />
		</div>
	);
}

function ConfigTextarea({
	label,
	...props
}: ComponentProps<typeof Textarea> & { label: ReactNode }) {
	const generatedId = useId();
	const id = props.id ?? generatedId;
	return (
		<div className="grid min-w-0 gap-1.5">
			<FormLabel htmlFor={id}>{label}</FormLabel>
			<Textarea rows={4} {...props} id={id} />
		</div>
	);
}

function ConfigSelect({
	label,
	value,
	onValueChange,
	options,
	name,
	disabled,
	className,
}: {
	label: string;
	value: string;
	onValueChange: (value: string) => void;
	options: Array<{ value: string; label: string }>;
	name?: string;
	disabled?: boolean;
	className?: string;
}) {
	const id = useId();
	return (
		<div className={cn("grid min-w-0 gap-1.5", className)}>
			<FormLabel htmlFor={id}>{label}</FormLabel>
			<Select
				name={name}
				value={value}
				onValueChange={onValueChange}
				disabled={disabled}
			>
				<SelectTrigger
					id={id}
					aria-label={label}
					className="w-full rounded-lg bg-background/50"
				>
					<span className="truncate">
						{options.find((option) => option.value === value)?.label}
					</span>
				</SelectTrigger>
				<SelectContent portal>
					{options.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}

function ConfigMessage({ children }: { children?: ReactNode }) {
	if (!children) return null;
	return (
		<p
			className="m-0 text-sm text-muted-foreground [overflow-wrap:anywhere]"
			role="status"
		>
			{children}
		</p>
	);
}

function ConfigDetailsTable({
	columns,
	rows,
}: {
	columns: { key: string; label: string }[];
	rows: Array<Record<string, ReactNode>>;
}) {
	return (
		<AdminRecords<Record<string, ReactNode> & { recordId: string }>
			framed={false}
			rows={rows.map((row, index) => ({
				...row,
				recordId: String(row.id ?? index),
			}))}
			rowKey={(row) => row.recordId}
			columns={columns.map((column) => ({
				...column,
				render: (row) => row[column.key],
			}))}
		/>
	);
}

export {
	ConfigDetailsTable,
	ConfigField,
	ConfigFormFields,
	ConfigMessage,
	ConfigPanel,
	ConfigPanelGrid,
	ConfigSelect,
	ConfigShell,
	ConfigSwitch,
	ConfigTextarea,
};
