import { AdminRecords } from "@/components/admin/admin-records";
import { Frame } from "@/components/workspace/frame";
import { useI18n } from "@/i18n/use-i18n";
import { localizedPath } from "@/i18n/messages";
import { Form, Field, api } from "@/components/forms";
import type { getFiles, getFile } from "@/server/functions/foundation";
type Files = Awaited<ReturnType<typeof getFiles>>;
export function FileLibrary({
	rows,
	admin = false,
}: {
	rows: Files;
	admin?: boolean;
}) {
	const { locale } = useI18n(),
		zh = locale === "zh";
	return (
		<Frame title={zh ? "文件库" : "File library"} admin={admin}>
			{!admin && (
				<a href={localizedPath("/app/assets/upload", locale)}>
					{zh ? "上传文件" : "Upload a file"}
				</a>
			)}
			<AdminRecords
				rows={rows}
				rowKey={(r) => r.id}
				searchText={(r) => r.name + " " + r.email}
				columns={[
					{
						key: "name",
						label: zh ? "文件名" : "File name",
						render: (r) => (
							<a
								href={
									admin
										? "/api/core/assets/" + r.id
										: localizedPath("/app/assets/" + r.id, locale)
								}
							>
								{r.name}
							</a>
						),
					},
					{
						key: "size",
						label: zh ? "大小（字节）" : "Size (bytes)",
						render: (r) => r.bytes.toLocaleString(locale),
					},
					...(admin
						? [
								{
									key: "owner",
									label: zh ? "所有者" : "Owner",
									render: (r: Files[number]) => r.email,
								},
							]
						: []),
					{
						key: "created",
						label: zh ? "上传时间（UTC）" : "Uploaded (UTC)",
						render: (r) => r.created,
					},
				]}
			/>
		</Frame>
	);
}
export function FileDetail({
	file,
}: {
	file: Awaited<ReturnType<typeof getFile>>;
}) {
	const { locale } = useI18n(),
		zh = locale === "zh";
	return (
		<Frame title={file.name}>
			<dl>
				<dt>{zh ? "文件大小" : "Size"}</dt>
				<dd>{file.bytes.toLocaleString(locale)} B</dd>
				<dt>{zh ? "上传时间（UTC）" : "Uploaded (UTC)"}</dt>
				<dd>{file.created}</dd>
			</dl>
			<a href={"/api/core/files/" + file.id}>
				{zh ? "下载私有文件" : "Download private file"}
			</a>
		</Frame>
	);
}
export function Upload() {
	const { locale } = useI18n(),
		zh = locale === "zh";
	return (
		<Frame title={zh ? "上传私有文件" : "Upload private file"}>
			<Form
				button={zh ? "上传" : "Upload"}
				submit={async (form) => {
					await api("files", form);
					location.assign(localizedPath("/app/assets", locale));
				}}
			>
				<Field
					name="file"
					label={zh ? "选择文件，最大 8 MiB" : "Choose a file up to 8 MiB"}
					type="file"
				/>
			</Form>
		</Frame>
	);
}
