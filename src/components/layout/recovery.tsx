import type { ReactNode } from "react";
export function RecoveryContent({
	title,
	description,
	action,
}: {
	title: string;
	description: string;
	action: ReactNode;
}) {
	return (
		<section role="alert" className="rounded-lg border border-border p-6">
			<h2>{title}</h2>
			<p>{description}</p>
			{action}
		</section>
	);
}
