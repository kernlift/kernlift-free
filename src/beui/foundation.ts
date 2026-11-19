/** Shared application typography and Lucide metrics; never apply to authored document content. */
export const uiTypography = {
	caption: "text-xs leading-4 font-normal",
	label: "text-sm leading-5 font-medium",
	control: "text-sm leading-5 font-medium",
	body: "text-sm leading-6 font-normal",
	reading: "text-base leading-7 font-normal",
	section: "text-lg leading-7 font-semibold tracking-tight",
	page: "text-2xl leading-8 font-semibold tracking-tight",
	brand: "text-xl leading-7 font-medium tracking-tight",
} as const;

export const uiIcon = {
	inline: { size: 16, strokeWidth: 2 },
	control: { size: 20, strokeWidth: 2 },
	prominent: { size: 24, strokeWidth: 2 },
} as const;

export const uiFontFamily =
	'"Geist Variable", Geist, "Noto Sans SC", ui-sans-serif, system-ui, sans-serif';
