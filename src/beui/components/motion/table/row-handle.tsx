"use client";

import {
	ArrowDownToLine,
	ArrowUpToLine,
	MoreVertical,
	Trash2,
} from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useTableCopy } from "./copy";
import { TableMenu } from "./table-menu";

/** The row handle, portaled so it can sit on the row's left border without the
 * scroll container clipping it. Straddles the border to bridge hover. */
export function RowHandle({
	rowEl,
	id,
	index,
	onInsertRow,
	onDeleteRow,
	onEnter,
	onLeave,
}: {
	rowEl: HTMLTableRowElement | null;
	id: string;
	index: number;
	onInsertRow?: (index: number, position: "before" | "after") => void;
	onDeleteRow?: (rowId: string, index: number) => void;
	onEnter: () => void;
	onLeave: () => void;
}) {
	const copy = useTableCopy();
	useEffect(() => {
		window.addEventListener("scroll", onLeave, true);
		return () => window.removeEventListener("scroll", onLeave, true);
	}, [onLeave]);

	if (!rowEl || typeof document === "undefined") return null;
	const rect = rowEl.getBoundingClientRect();

	return createPortal(
		<div
			style={{
				position: "fixed",
				top: rect.top + rect.height / 2,
				left: rect.left,
				transform: "translate(-50%, -50%)",
				zIndex: 40,
			}}
			onPointerEnter={onEnter}
			onPointerLeave={onLeave}
		>
			<TableMenu
				ariaLabel={copy.rowOptions.replace("{row}", String(index + 1))}
				triggerClassName="flex h-6 w-2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
				trigger={<MoreVertical className="h-4 w-4" />}
				items={[
					...(onInsertRow
						? [
								{
									label: copy.insertBefore,
									icon: <ArrowUpToLine />,
									onSelect: () => onInsertRow(index, "before"),
								},
								{
									label: copy.insertAfter,
									icon: <ArrowDownToLine />,
									onSelect: () => onInsertRow(index, "after"),
								},
							]
						: []),
					...(onDeleteRow
						? [
								{
									label: copy.deleteRow,
									icon: <Trash2 />,
									destructive: true,
									onSelect: () => onDeleteRow(id, index),
								},
							]
						: []),
				]}
			/>
		</div>,
		document.body,
	);
}
