"use client";
import {
	Table as SharedTable,
	type TableProps as SharedTableProps,
} from "@/beui/components/motion/table";
import { useBeuiCopy } from "@/components/motion/locale";

export type {
	SortDirection,
	SortState,
	TableColumn,
} from "@/beui/components/motion/table";
export type TableProps<T> = Omit<SharedTableProps<T>, "labels">;
export function Table<T>(props: TableProps<T>) {
	const copy = useBeuiCopy();
	return <SharedTable {...props} labels={copy.table} />;
}
