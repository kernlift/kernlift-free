import { createContext, useContext } from "react";
export interface TableLabels {
	empty: string;
	emptyCell: string;
	insertBefore: string;
	insertAfter: string;
	deleteColumn: string;
	deleteRow: string;
	selectAll: string;
	selectRow: string;
	cell: string;
	renameColumn: string;
	reorderColumn: string;
	resizeColumn: string;
	rowOptions: string;
	columnOptions: string;
}
export const TableCopyContext = createContext<TableLabels | null>(null);
export function useTableCopy() {
	const copy = useContext(TableCopyContext);
	if (!copy) throw new Error("Table copy provider required");
	return copy;
}
