import { Form, Field, api } from "@/components/forms";
import { useI18n } from "@/i18n/use-i18n";
export function Preferences({
	country,
	notifications,
}: {
	country: string;
	notifications: boolean;
}) {
	const { locale } = useI18n(),
		zh = locale === "zh";
	return (
		<Form
			button={zh ? "保存偏好" : "Save preferences"}
			submit={(f) => api("profile", f)}
		>
			<Field
				name="country"
				label={
					zh ? "国家或地区（两位代码）" : "Country or region (two-letter code)"
				}
				required={false}
				value={country}
			/>
			<label>
				<input
					type="checkbox"
					name="notifications"
					defaultChecked={notifications}
				/>{" "}
				{zh ? "客服回复时发送邮件" : "Email me when support replies"}
			</label>
		</Form>
	);
}
