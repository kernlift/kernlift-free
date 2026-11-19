"use client";

import { useId, useState } from "react";
import { Button } from "@/components/motion/button";
import { Table, type TableColumn } from "@/components/motion/table";
import { useI18n } from "@/i18n/use-i18n";
import { cn } from "@/lib/utils";

type AppDataTableProps<Row> = {
	label: string;
	data: Row[];
	columns: TableColumn<Row>[];
	getRowId: (row: Row) => string;
	emptyState?: React.ReactNode;
	className?: string;
	paginate?: boolean;
	autoHeight?: boolean;
	renderMobileRow?: (row: Row) => React.ReactNode;
	renderSubRow?: (row: Row) => React.ReactNode;
};

const PAGE_SIZE = 10;
const ROW_HEIGHT = 48;

/** Account tables share beUI's renderer, with the existing ten-row pagination. */
export function AppDataTable<Row>({
	label,
	data,
	columns,
	getRowId,
	emptyState,
	className,
	paginate = true,
	autoHeight = false,
	renderMobileRow,
	renderSubRow,
}: AppDataTableProps<Row>) {
	const { t } = useI18n();
	const id = useId();
	const rowIds = JSON.stringify(data.map(getRowId));
	const [pagination, setPagination] = useState({ rowIds, pageIndex: 0 });
	// Filters and refreshed records must never leave the user on an empty later page.
	if (pagination.rowIds !== rowIds) setPagination({ rowIds, pageIndex: 0 });
	const pageCount = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
	const pageIndex =
		pagination.rowIds === rowIds
			? Math.min(pagination.pageIndex, pageCount - 1)
			: 0;
	const start = paginate ? pageIndex * PAGE_SIZE : 0;
	const page = paginate ? data.slice(start, start + PAGE_SIZE) : data;

	if (data.length === 0) {
		return (
			<div
				role="status"
				className={cn(
					"min-w-0 p-8 text-center text-sm text-muted-foreground",
					className,
				)}
			>
				{emptyState ?? t("appTable.empty")}
			</div>
		);
	}

	return (
		<div
			className={cn("grid w-full min-w-0 gap-3", className)}
			data-app-data-table
			data-beui
		>
			{renderMobileRow && (
				<ol
					aria-label={label}
					className="grid divide-y divide-border md:hidden"
					data-mobile-records
				>
					{page.map((row) => (
						<li key={getRowId(row)} className="min-w-0 py-4">
							{renderMobileRow(row)}
						</li>
					))}
				</ol>
			)}
			<div className={renderMobileRow ? "hidden min-w-0 md:block" : "min-w-0"}>
				<Table
					key={`${rowIds}:${pageIndex}`}
					ariaLabel={label}
					autoHeight={autoHeight}
					columns={columns}
					data={page}
					emptyState={emptyState ?? t("appTable.empty")}
					getRowId={getRowId}
					renderSubRow={renderSubRow}
					height={Math.min(
						528,
						Math.max(216, (page.length + 1) * ROW_HEIGHT + 16),
					)}
				/>
			</div>
			{paginate && data.length > PAGE_SIZE ? (
				<nav
					aria-label={t("appTable.pagination").replace("{table}", label)}
					className="flex flex-wrap items-center justify-between gap-3 px-4 pb-3 text-sm text-muted-foreground"
				>
					<span aria-live="polite" id={id}>
						{t("appTable.range")
							.replace("{start}", String(start + 1))
							.replace(
								"{end}",
								String(Math.min(start + PAGE_SIZE, data.length)),
							)
							.replace("{total}", String(data.length))}
					</span>
					<div className="flex items-center gap-2">
						<Button
							aria-describedby={id}
							className="max-sm:min-h-11"
							disabled={pageIndex === 0}
							onClick={() =>
								setPagination({ rowIds, pageIndex: pageIndex - 1 })
							}
							variant="outline"
						>
							{t("appTable.previous")}
						</Button>
						<span className="tabular-nums">
							{t("appTable.page")
								.replace("{page}", String(pageIndex + 1))
								.replace("{total}", String(pageCount))}
						</span>
						<Button
							aria-describedby={id}
							className="max-sm:min-h-11"
							disabled={pageIndex === pageCount - 1}
							onClick={() =>
								setPagination({ rowIds, pageIndex: pageIndex + 1 })
							}
							variant="outline"
						>
							{t("appTable.next")}
						</Button>
					</div>
				</nav>
			) : null}
		</div>
	);
}
