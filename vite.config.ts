import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
export default defineConfig(({ command }) => ({
	resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
	plugins: [
		tailwindcss(),
		...(command === "build" ? [nitro()] : []),
		tanstackStart(),
		react(),
	],
}));
