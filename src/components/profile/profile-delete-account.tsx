"use client";

import { EditorDialog } from "@/beui/editor-dialog";
import { FormError } from "@/beui/form-layout";
import { useRef, useState } from "react";
import { getDictionary, type Locale, localizedPath } from "../../i18n/messages";
import { deleteCurrentUser } from "../../server/functions/auth";
import { Button, type ButtonState, StatefulButton } from "../motion/button";

export function ProfileDeleteAccount({ locale }: { locale: Locale }) {
	const { t } = getDictionary(locale);
	const [open, setOpen] = useState(false);
	const [state, setState] = useState<ButtonState>("idle");
	const [error, setError] = useState("");
	const busy = useRef(false);
	const cancel = useRef<HTMLButtonElement>(null);

	async function remove() {
		if (busy.current) return;
		busy.current = true;
		setState("loading");
		setError("");
		try {
			await deleteCurrentUser();
			window.location.assign(localizedPath("/", locale));
		} catch {
			setError(t("app.profile.unableToDelete"));
			setState("error");
			busy.current = false;
		}
	}

	return (
		<section
			aria-labelledby="profile-delete-title"
			className="grid gap-4 scroll-mt-24"
			id="profile-danger"
		>
			<div className="grid gap-2">
				<h2 className="text-lg font-semibold" id="profile-delete-title">
					{t("app.profile.deleteTitle")}
				</h2>
				<p className="text-sm leading-6 text-muted-foreground">
					{t("app.profile.deleteWarning")} {t("app.profile.irreversible")}
				</p>
			</div>
			<Button
				className="w-fit"
				onClick={() => {
					setError("");
					setState("idle");
					setOpen(true);
				}}
				variant="danger"
			>
				{t("app.profile.deleteAccount")}
			</Button>
			<EditorDialog
				closeLabel={t("app.profile.cancel")}
				description={t("app.profile.deleteWarning")}
				initialFocus={cancel}
				onOpenChange={(next) => {
					if (!busy.current) setOpen(next);
				}}
				open={open}
				title={t("app.profile.deleteTitle")}
				footer={
					<>
						<Button
							disabled={state === "loading"}
							onClick={() => setOpen(false)}
							ref={cancel}
							variant="outline"
						>
							{t("app.profile.cancel")}
						</Button>
						<StatefulButton
							errorText={t("app.profile.deleteAccount")}
							loadingText={t("app.profile.deletingAccount")}
							onClick={remove}
							state={state}
							successText={t("app.profile.accountDeleted")}
							variant="danger"
						>
							{t("app.profile.deleteAccount")}
						</StatefulButton>
					</>
				}
			>
				<div aria-busy={state === "loading"} className="grid gap-4">
					<p className="text-sm">{t("app.profile.irreversible")}</p>
					{error && <FormError>{error}</FormError>}
				</div>
			</EditorDialog>
		</section>
	);
}
