"use client";

import {
	type MutableRefObject,
	useCallback,
	useLayoutEffect,
	useState,
} from "react";

export type PortalLayout = {
	viewport: { left: number; top: number; width: number; height: number };
	trigger: {
		left: number;
		top: number;
		width: number;
		height: number;
	};
	content: {
		width: number;
		height: number;
	};
};

function sameLayout(a: PortalLayout | null, b: PortalLayout) {
	return (
		a?.viewport.left === b.viewport.left &&
		a.viewport.top === b.viewport.top &&
		a.viewport.width === b.viewport.width &&
		a.viewport.height === b.viewport.height &&
		a.trigger.left === b.trigger.left &&
		a.trigger.top === b.trigger.top &&
		a.trigger.width === b.trigger.width &&
		a.trigger.height === b.trigger.height &&
		a.content.width === b.content.width &&
		a.content.height === b.content.height
	);
}

/** Measures a trigger and portalled panel in viewport coordinates. */
export function usePopoverPortalPosition<
	TriggerElement extends HTMLElement,
	ContentElement extends HTMLElement,
>(
	triggerRef: MutableRefObject<TriggerElement | null>,
	contentRef: MutableRefObject<ContentElement | null>,
	active: boolean,
	measureViewportSize = false,
) {
	const [layout, setLayout] = useState<PortalLayout | null>(null);

	const update = useCallback(() => {
		const trigger = triggerRef.current;
		const content = contentRef.current;
		if (!trigger || !content) return;

		const rect = trigger.getBoundingClientRect();
		const viewport = window.visualViewport;
		const next: PortalLayout = {
			viewport: {
				left: viewport?.offsetLeft ?? 0,
				top: viewport?.offsetTop ?? 0,
				width: viewport?.width ?? window.innerWidth,
				height: viewport?.height ?? window.innerHeight,
			},
			trigger: {
				left: rect.left,
				top: rect.top,
				width: rect.width,
				height: rect.height,
			},
			content: {
				width: measureViewportSize
					? content.getBoundingClientRect().width
					: content.offsetWidth,
				height: measureViewportSize
					? content.getBoundingClientRect().height
					: content.offsetHeight,
			},
		};
		setLayout((current) => (sameLayout(current, next) ? current : next));
	}, [contentRef, triggerRef, measureViewportSize]);

	useLayoutEffect(() => {
		update();
		if (!active) return;

		const trigger = triggerRef.current;
		const content = contentRef.current;
		const observer = new ResizeObserver(update);
		if (trigger) observer.observe(trigger);
		if (content) observer.observe(content);

		window.addEventListener("scroll", update, true);
		window.addEventListener("resize", update);
		window.visualViewport?.addEventListener("resize", update);
		window.visualViewport?.addEventListener("scroll", update);
		return () => {
			observer.disconnect();
			window.removeEventListener("scroll", update, true);
			window.removeEventListener("resize", update);
			window.visualViewport?.removeEventListener("resize", update);
			window.visualViewport?.removeEventListener("scroll", update);
		};
	}, [active, contentRef, triggerRef, update]);

	return layout;
}
