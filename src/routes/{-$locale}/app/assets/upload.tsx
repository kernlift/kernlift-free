import { createFileRoute } from "@tanstack/react-router";
import { Upload } from "@/components/files/library";

export const Route = createFileRoute("/{-$locale}/app/assets/upload")({
	component: Upload,
});
