"use client";
import {
	MorphingModal as SharedModal,
	type MorphingModalProps as SharedProps,
} from "@/beui/components/motion/morphing-modal";
import { useBeuiCopy } from "./locale";
export type MorphingModalProps = Omit<
	SharedProps,
	"ariaLabel" | "closeLabel"
> & {
	ariaLabel?: string;
	closeLabel?: string;
};
export function MorphingModal({
	ariaLabel,
	closeLabel,
	...props
}: MorphingModalProps) {
	const copy = useBeuiCopy();
	return (
		<SharedModal
			{...props}
			ariaLabel={ariaLabel ?? copy.details}
			closeLabel={closeLabel ?? copy.dismiss}
		/>
	);
}
