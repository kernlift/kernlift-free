"use client";

import {
	SelectValue as SharedSelectValue,
	type SelectValueProps as SharedSelectValueProps,
} from "@/beui/components/motion/select";
import { useBeuiCopy } from "./locale";

export type {
	SelectContentProps,
	SelectItemProps,
	SelectProps,
	SelectTriggerProps,
} from "@/beui/components/motion/select";
export {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "@/beui/components/motion/select";
export type SelectValueProps = Omit<SharedSelectValueProps, "placeholder"> & {
	placeholder?: string;
};

// Site locale adaptation only; both site and standalone editors use the same beUI select.
export function SelectValue({ placeholder, ...props }: SelectValueProps) {
	const copy = useBeuiCopy();
	return (
		<SharedSelectValue
			{...props}
			placeholder={placeholder ?? copy.chooseOption}
		/>
	);
}
