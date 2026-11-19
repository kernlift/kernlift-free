import { Inbox, Search } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Button } from "@/components/motion/button";
import { Input } from "@/components/motion/input";
import { useBeuiCopy, useBeuiLocale } from "@/components/motion/locale";
import { Surface } from "@/components/motion/surface";
import { Table } from "@/components/motion/table";
import { adminWorkspaceMessages } from "@/i18n/admin-workspace";
import { AdminFilterBar } from "./admin-filter-bar";
import { recordWindow } from "./record-window";

export type AdminRecordColumn<T> = {
	key: string;
	label: string;
	width?: string;
	render: (row: T) => ReactNode;
};
export type AdminRecordsPagination = {
	onPageChange(page: number): void;
	page: number;
	pageSize: number;
	pending?: boolean;
	total: number;
};

/** Shared beUI record composition: bounded desktop pages and fully labeled phone records. */
export function AdminRecords<T>({
	columns,
	emptyLabel,
	rowKey,
	rows,
	framed = true,
	title,
	searchText,
	filters,
	resetPageKey,
	searchQuery,
	onSearchQueryChange,
	pagination,
}: {
	columns: Array<AdminRecordColumn<T>>;
	emptyLabel?: string;
	rowKey: (row: T) => string;
	rows: T[];
	framed?: boolean;
	title?: string;
	searchText?: (row: T) => string;
	filters?: ReactNode;
	resetPageKey?: string;
	searchQuery?: string;
	onSearchQueryChange?: (query: string) => void;
	pagination?: AdminRecordsPagination;
}) {
	const copy = adminWorkspaceMessages[useBeuiLocale()];
	const beui = useBeuiCopy();
	const pageSize = 25;
	const [page, setPage] = useState(0);
	const [internalQuery, setInternalQuery] = useState("");
	const searchRef = useRef<HTMLInputElement>(null);
	const query = searchQuery ?? internalQuery;
	function setQuery(next: string) {
		if (searchQuery === undefined) setInternalQuery(next);
		onSearchQueryChange?.(next);
	}
	useEffect(() => {
		if (resetPageKey !== undefined) setPage(0);
	}, [resetPageKey]);
	const filteredRows =
		searchText && query.trim()
			? rows.filter((row) =>
					searchText(row)
						.toLocaleLowerCase()
						.includes(query.trim().toLocaleLowerCase()),
				)
			: rows;
	const totalRows = pagination?.total ?? filteredRows.length;
	const effectivePageSize = pagination?.pageSize ?? pageSize;
	const window = recordWindow({
		total: totalRows,
		page: pagination ? pagination.page - 1 : page,
		pageSize: effectivePageSize,
		loaded: filteredRows.length,
		remote: Boolean(pagination),
	});
	const { page: currentPage, lastPage } = window;
	const pageRows = filteredRows.slice(window.sliceStart, window.sliceEnd);
	function clearSearch() {
		setQuery("");
		setPage(0);
		searchRef.current?.focus();
	}
	const Frame = framed ? Surface : "div";
	return (
		<Frame
			className="@container min-w-0 gap-0 rounded-xl py-0"
			data-admin-records
			aria-busy={pagination?.pending || undefined}
		>
			{searchText || filters ? (
				<AdminFilterBar className="border-b border-border/70 p-4 sm:px-5">
					{searchText ? (
						<div className="flex min-w-0 items-end gap-2 !flex-[2_1_18rem]">
							<Input
								ref={searchRef}
								className="min-w-0 flex-1"
								classNames={{ field: "rounded-lg bg-background/50" }}
								leftIcon={<Search aria-hidden className="size-4" />}
								type="search"
								label={filters ? copy.search : undefined}
								aria-label={copy.search}
								placeholder={copy.search}
								value={query}
								onChange={(value) => {
									setQuery(value);
									setPage(0);
								}}
							/>
							{query ? (
								<Button
									className="shrink-0"
									variant="ghost"
									size="sm"
									onClick={clearSearch}
								>
									{copy.clearSearch}
								</Button>
							) : null}
						</div>
					) : null}
					{filters}
				</AdminFilterBar>
			) : null}
			{!filteredRows.length ? (
				<div className="grid justify-items-center gap-3 px-6 py-14 text-center">
					<span className="flex size-11 items-center justify-center rounded-xl border border-border bg-muted/50 text-muted-foreground">
						{query.trim() ? (
							<Search aria-hidden className="size-5" />
						) : (
							<Inbox aria-hidden className="size-5" />
						)}
					</span>
					<p
						className="m-0 max-w-sm text-sm leading-6 text-muted-foreground"
						role="status"
					>
						{query.trim() ? copy.noResults : (emptyLabel ?? beui.table.empty)}
					</p>
					{query.trim() ? (
						<Button size="sm" variant="outline" onClick={clearSearch}>
							{copy.clearSearch}
						</Button>
					) : null}
				</div>
			) : (
				<>
					<ol
						className="m-0 list-none divide-y divide-border p-0 @min-[48rem]:hidden"
						aria-label={title ?? copy.records}
					>
						{pageRows.map((row) => (
							<li key={rowKey(row)} className="min-w-0 p-4">
								<dl className="m-0 grid min-w-0 gap-3">
									{columns.map((column, index) => (
										<div
											key={column.key}
											className={
												index === 0
													? "grid min-w-0 gap-1 border-b border-border pb-3"
													: "grid min-w-0 grid-cols-[minmax(5rem,0.4fr)_minmax(0,1fr)] gap-3"
											}
										>
											<dt className="text-xs text-muted-foreground">
												{column.label}
											</dt>
											<dd className="m-0 min-w-0 whitespace-normal text-sm [overflow-wrap:anywhere]">
												{column.render(row)}
											</dd>
										</div>
									))}
								</dl>
							</li>
						))}
					</ol>
					<div className="hidden @min-[48rem]:block">
						<Table<T>
							className="border-0 bg-transparent [&_tbody_th]:font-normal [&_tbody_tr]:motion-reduce:transition-none"
							ariaLabel={title ?? copy.records}
							autoHeight
							columns={columns.map((column, index) => ({
								key: column.key,
								header: column.label,
								rowHeader: index === 0,
								width: column.width ?? (index === 0 ? "15rem" : "10rem"),
								cell: (row) => (
									<div className="whitespace-normal py-3 text-sm leading-5 tabular-nums [overflow-wrap:anywhere]">
										{column.render(row)}
									</div>
								),
							}))}
							data={pageRows}
							getRowId={rowKey}
						/>
					</div>
				</>
			)}
			<footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 bg-muted/20 px-4 py-3 sm:px-5">
				<p
					className="m-0 text-xs tabular-nums text-muted-foreground"
					role="status"
					aria-live="polite"
					aria-atomic="true"
				>
					{pagination?.pending
						? copy.updatingRecords
						: copy.range(window.first, window.last, totalRows)}
				</p>
				{totalRows > effectivePageSize ? (
					<nav aria-label={copy.pagination} className="flex items-center gap-2">
						<Button
							size="sm"
							variant="outline"
							disabled={currentPage === 0 || pagination?.pending}
							onClick={() =>
								pagination
									? pagination.onPageChange(currentPage)
									: setPage(currentPage - 1)
							}
						>
							{copy.previous}
						</Button>
						<Button
							size="sm"
							variant="outline"
							disabled={currentPage === lastPage || pagination?.pending}
							onClick={() =>
								pagination
									? pagination.onPageChange(currentPage + 2)
									: setPage(currentPage + 1)
							}
						>
							{copy.next}
						</Button>
					</nav>
				) : null}
			</footer>
		</Frame>
	);
}
