export function CodeBlock({
	code,
	filename,
}: {
	code: string;
	filename: string;
	maxHeight?: number;
	language: string;
	labels: unknown;
	showStatus: boolean;
	wrap: boolean;
	showLineNumbers: boolean;
}) {
	return (
		<figure>
			<figcaption>{filename}</figcaption>
			<pre className="overflow-auto whitespace-pre-wrap">{code}</pre>
		</figure>
	);
}
