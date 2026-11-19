"use client";

import { createContext, type ReactNode, useContext } from "react";

const PortalContext = createContext<{
	container: HTMLElement | null;
	local: boolean;
	layer: number;
}>({ container: null, local: false, layer: 0 });
export function BeuiPortalProvider({
	container,
	children,
	local = false,
	layer = 0,
}: {
	container: HTMLElement | null;
	children: ReactNode;
	local?: boolean;
	layer?: number;
}) {
	return (
		<PortalContext.Provider value={{ container, local, layer }}>
			{children}
		</PortalContext.Provider>
	);
}
export function useBeuiPortalContainer() {
	return (
		useContext(PortalContext).container ??
		(typeof document === "undefined" ? null : document.body)
	);
}
export function useBeuiOverlayLayer() {
	return useContext(PortalContext).layer;
}

/** Local portals stay in a modal's DOM/focus scope, outside its scrolling content. */
export function useBeuiPortalCoordinates() {
	const { container, local, layer } = useContext(PortalContext);
	return ({
		left,
		top,
		width,
	}: {
		left: number;
		top: number;
		width?: number;
	}) => {
		if (!local || !container)
			return {
				left,
				top,
				width,
				position: "fixed" as const,
				zIndex: Math.max(10000, layer + 1),
			};
		const rect = container.getBoundingClientRect();
		const scaleX = rect.width / container.offsetWidth || 1;
		const scaleY = rect.height / container.offsetHeight || 1;
		return {
			left:
				(left - rect.left) / scaleX -
				container.clientLeft +
				container.scrollLeft,
			top:
				(top - rect.top) / scaleY - container.clientTop + container.scrollTop,
			width: width === undefined ? undefined : width / scaleX,
			position: "absolute" as const,
			zIndex: Math.max(10000, layer + 1),
		};
	};
}
