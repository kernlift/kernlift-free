import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from "lucide-react";
import { type ReactNode, useId } from "react";

export type RecoverySeverity = "info" | "warning" | "error" | "success";

/** Static content hierarchy; controls and disclosure motion belong to beUI. */
export function RecoveryContent({
	title,
	description,
	severity = "error",
	action,
	children,
}: {
	title: string;
	description: string;
	severity?: RecoverySeverity;
	action?: ReactNode;
	children?: ReactNode;
}) {
	const headingId = useId();
	const Icon = {
		info: Info,
		warning: ShieldAlert,
		error: AlertTriangle,
		success: CheckCircle2,
	}[severity];
	return (
		<section
			data-beui="recovery-content"
			aria-labelledby={headingId}
			className="mx-auto grid w-full min-w-0 max-w-5xl gap-8 border-t border-border py-10 sm:py-16 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]"
		>
			<div className="grid content-start gap-6">
				<Icon
					size={28}
					strokeWidth={1.75}
					aria-hidden
					className="text-[var(--brand-accent)]"
				/>
				<div className="space-y-4">
					<h1
						id={headingId}
						className="m-0 text-[clamp(3.4rem,8vw,7rem)] leading-[0.83] font-black tracking-[-0.09em] text-foreground uppercase"
					>
						{title}
					</h1>
					<p className="max-w-xl text-base leading-7 text-muted-foreground">
						{description}
					</p>
				</div>
			</div>
			<div className="grid content-start gap-6 border-l-0 border-border lg:border-l lg:pl-8">
				{action ? (
					<div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
						{action}
					</div>
				) : null}
				{children}
			</div>
		</section>
	);
}
