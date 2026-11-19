"use client";

import { useSyncExternalStore } from "react";

const query = "(prefers-reduced-motion: reduce)";
const serverSnapshot = () => false;
function snapshot() {
	return typeof window !== "undefined" &&
		typeof window.matchMedia === "function"
		? window.matchMedia(query).matches
		: false;
}
function subscribe(onChange: () => void) {
	if (typeof window === "undefined" || typeof window.matchMedia !== "function")
		return () => {};
	const media = window.matchMedia(query);
	media.addEventListener("change", onChange);
	return () => media.removeEventListener("change", onChange);
}

/** Reactively follows OS preference changes, including while a route stays mounted. */
export function useReducedMotionPreference() {
	return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
