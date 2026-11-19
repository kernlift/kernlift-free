"use client";

import { FormError } from "@/beui/form-layout";
import { type FormEvent, useRef, useState } from "react";
import { getDictionary, type Locale } from "../../i18n/messages";
import {
	resendCurrentUserVerificationEmail,
	updateCurrentUserProfile,
} from "../../server/functions/auth";
import { useAuth } from "../auth/auth-state";
import { Button, type ButtonState, StatefulButton } from "../motion/button";
import { Input } from "../motion/input";

type ProfileUser = {
	id: string;
	name?: string | null;
	email?: string | null;
	emailVerified?: boolean | null;
};

export function ProfilePersonalInfoPanel({
	locale = "en",
	user,
}: {
	locale?: Locale;
	user: ProfileUser;
}) {
	const { t } = getDictionary(locale);
	const { refresh } = useAuth();
	const [savedName, setSavedName] = useState(user.name ?? "");
	const [name, setName] = useState(savedName);
	const [saveState, setSaveState] = useState<ButtonState>("idle");
	const [error, setError] = useState("");
	const [verificationState, setVerificationState] =
		useState<ButtonState>("idle");
	const [verificationMessage, setVerificationMessage] = useState("");
	const [verified, setVerified] = useState(Boolean(user.emailVerified));
	const saveBusy = useRef(false);
	const verifyBusy = useRef(false);
	const dirty = name !== savedName;

	async function onSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (saveBusy.current || !dirty) return;
		const trimmedName = name.trim();
		if (!trimmedName || trimmedName.length > 80) {
			setError(t("app.profile.nameRequired"));
			return;
		}
		saveBusy.current = true;
		setSaveState("loading");
		setError("");
		try {
			const updated = await updateCurrentUserProfile({
				data: { name: trimmedName },
			});
			setSavedName(updated.name);
			setName(updated.name);
			setSaveState("success");
			window.dispatchEvent(
				new CustomEvent("app-profile-updated", {
					detail: { userId: user.id, name: updated.name, email: updated.email },
				}),
			);
			// Persistence succeeded; an unavailable session refresh must not turn it into a save failure.
			void refresh().catch(() => {});
		} catch {
			setError(t("app.profile.unableToSaveProfile"));
			setSaveState("error");
		} finally {
			saveBusy.current = false;
		}
	}

	async function sendVerificationEmail() {
		if (verifyBusy.current) return;
		verifyBusy.current = true;
		setVerificationState("loading");
		setVerificationMessage("");
		try {
			const result = await resendCurrentUserVerificationEmail({
				data: { locale },
			});
			if (result.status === "already_verified") {
				setVerified(true);
				setVerificationState("success");
				setVerificationMessage(t("app.profile.emailAlreadyVerified"));
				void refresh().catch(() => {});
			} else if (result.status === "sent" || result.status === "queued") {
				setVerificationState("success");
				setVerificationMessage(t("app.profile.verificationEmailSent"));
			} else {
				setVerificationState("error");
				setVerificationMessage(
					t(
						result.status === "not_configured"
							? "app.profile.verificationUnavailable"
							: "app.profile.unableToSendVerification",
					),
				);
			}
		} catch {
			setVerificationState("error");
			setVerificationMessage(t("app.profile.unableToSendVerification"));
		} finally {
			verifyBusy.current = false;
		}
	}

	return (
		<section
			aria-labelledby="profile-identity-title"
			className="grid min-w-0 gap-5"
			id="profile-identity"
		>
			<h2 className="text-lg font-semibold" id="profile-identity-title">
				{t("app.profile.identity")}
			</h2>
			<form
				aria-label={t("app.profile.identity")}
				aria-busy={saveState === "loading"}
				className="grid gap-4"
				onSubmit={onSubmit}
			>
				<Input
					autoComplete="name"
					disabled={saveState === "loading"}
					id="profile-name"
					label={t("app.profile.fullName")}
					maxLength={80}
					minLength={1}
					name="name"
					onChange={(value) => {
						setName(value);
						setSaveState("idle");
						setError("");
					}}
					required
					value={name}
				/>
				{error && <FormError>{error}</FormError>}
				<div className="flex flex-wrap justify-end gap-2">
					{dirty && (
						<Button
							disabled={saveState === "loading"}
							onClick={() => {
								setName(savedName);
								setSaveState("idle");
								setError("");
							}}
							variant="ghost"
						>
							{t("app.profile.discardChanges")}
						</Button>
					)}
					<StatefulButton
						disabled={!dirty}
						errorText={t("app.profile.saveProfile")}
						loadingText={t("app.profile.savingProfile")}
						state={saveState}
						successText={t("app.profile.profileSaved")}
						type="submit"
					>
						{t("app.profile.saveProfile")}
					</StatefulButton>
				</div>
			</form>
			<dl className="grid gap-5 text-sm">
				<div className="grid gap-2">
					<dt className="font-medium">{t("app.profile.email")}</dt>
					<dd className="m-0 grid gap-3">
						<div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
							<span className="min-w-0 break-all">
								{user.email || t("app.profile.notSet")}
							</span>
							<span className="text-xs text-muted-foreground">
								{verified
									? t("app.profile.verified")
									: t("app.profile.unverified")}
							</span>
						</div>
						{!verified && (
							<StatefulButton
								className="w-fit max-w-full"
								errorText={t("app.profile.resendVerificationEmail")}
								loadingText={t("app.profile.sendingVerificationEmail")}
								onClick={sendVerificationEmail}
								state={verificationState}
								successText={t("app.profile.verificationSentShort")}
								variant="outline"
							>
								{t("app.profile.resendVerificationEmail")}
							</StatefulButton>
						)}
						{verificationMessage &&
							(verificationState === "error" ? (
								<FormError>{verificationMessage}</FormError>
							) : (
								<p role="status" className="text-sm text-muted-foreground">
									{verificationMessage}
								</p>
							))}
					</dd>
				</div>
				<div className="grid gap-2">
					<dt className="font-medium">{t("app.profile.accountId")}</dt>
					<dd className="m-0 break-all font-mono text-xs text-muted-foreground">
						{user.id}
					</dd>
				</div>
			</dl>
		</section>
	);
}
