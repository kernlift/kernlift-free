"use client";

import {
	type ButtonHTMLAttributes,
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";

export interface CheckedFieldProps
	extends Pick<
		ButtonHTMLAttributes<HTMLButtonElement>,
		| "id"
		| "aria-label"
		| "aria-labelledby"
		| "aria-describedby"
		| "aria-invalid"
		| "onFocus"
		| "onBlur"
		| "onKeyDown"
		| "tabIndex"
	> {
	checked?: boolean;
	defaultChecked?: boolean;
	onCheckedChange?: (checked: boolean) => void;
	disabled?: boolean;
	name?: string;
	form?: string;
	value?: string;
	label?: ReactNode;
	/** Layout of the complete control and its optional label. */
	className?: string;
}

/** Form state shared by the registry's button-based checkbox and switch. */
export function useCheckedField({
	checked,
	defaultChecked = false,
	onCheckedChange,
	form,
}: Pick<
	CheckedFieldProps,
	"checked" | "defaultChecked" | "onCheckedChange" | "form"
>) {
	const triggerRef = useRef<HTMLButtonElement>(null);
	const controlled = checked !== undefined;
	const [internal, setInternal] = useState(defaultChecked);
	const current = controlled ? checked : internal;
	const change = useCallback(
		(next: boolean) => {
			if (!controlled) setInternal(next);
			onCheckedChange?.(next);
		},
		[controlled, onCheckedChange],
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: `form` changes which form owns the button, so the reset listener must be re-bound to the new owner when it changes
	useEffect(() => {
		const owner = triggerRef.current?.form;
		if (!owner) return;
		let active = true;
		const reset = (event: Event) => {
			queueMicrotask(() => {
				if (active && !event.defaultPrevented && !controlled)
					setInternal(defaultChecked);
			});
		};
		owner.addEventListener("reset", reset);
		return () => {
			active = false;
			owner.removeEventListener("reset", reset);
		};
	}, [controlled, defaultChecked, form]);
	return { current, change, triggerRef };
}
