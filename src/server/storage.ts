import { createHash, createHmac } from "node:crypto";
export type S3Config = {
	bucketName: string;
	endpoint: string;
	region: string;
	accessKeyId: string;
	secretAccessKey: string;
};

/**
 * Where one object lives. Path style (`<endpoint>/<bucket>/<key>`) by default; virtual-hosted style
 * (`<bucket>.<endpoint>/<key>`) when the endpoint already names the bucket, or belongs to a
 * service that refuses path style (Alibaba Cloud OSS answers it with `SecondLevelDomainForbidden`).
 */
export function s3ObjectAddress(
	config: Pick<S3Config, "bucketName" | "endpoint">,
	objectKey: string,
) {
	const endpoint = new URL(config.endpoint);
	const hostname = endpoint.hostname.toLowerCase();
	const namesBucket = hostname.startsWith(
		`${config.bucketName.toLowerCase()}.`,
	);
	if (!namesBucket && !hostname.endsWith(".aliyuncs.com")) {
		const canonicalUri = `/${config.bucketName}/${encodePath(objectKey)}`;
		return {
			canonicalUri,
			host: endpoint.host,
			url: `${endpoint.origin}${canonicalUri}`,
		};
	}
	const hostedName = namesBucket
		? endpoint.hostname
		: `${config.bucketName}.${endpoint.hostname}`;
	const host = endpoint.port ? `${hostedName}:${endpoint.port}` : hostedName;
	const canonicalUri = `/${encodePath(objectKey)}`;
	return {
		canonicalUri,
		host,
		url: `${endpoint.protocol}//${host}${canonicalUri}`,
	};
}

export function signRequest(
	config: S3Config,
	method: "PUT" | "DELETE" | "HEAD",
	objectKey: string,
	body: Buffer,
	extraHeaders: Record<string, string>,
) {
	const now = new Date();
	const amzDate = amzTimestamp(now);
	const dateStamp = amzDate.slice(0, 8);
	const { canonicalUri, host, url } = s3ObjectAddress(config, objectKey);
	const payloadHash = sha256Hex(body);
	const headers: Record<string, string> = {
		host,
		"x-amz-content-sha256": payloadHash,
		"x-amz-date": amzDate,
		...extraHeaders,
	};
	const signedHeaders = Object.keys(headers).sort().join(";");
	const canonicalHeaders = Object.keys(headers)
		.sort()
		.map((key) => `${key}:${headers[key]}\n`)
		.join("");
	const canonicalRequest = [
		method,
		canonicalUri,
		"",
		canonicalHeaders,
		signedHeaders,
		payloadHash,
	].join("\n");
	const credentialScope = `${dateStamp}/${config.region}/s3/aws4_request`;
	const stringToSign = [
		"AWS4-HMAC-SHA256",
		amzDate,
		credentialScope,
		sha256Hex(canonicalRequest),
	].join("\n");
	const signature = hmacHex(
		signingKey(config.secretAccessKey, dateStamp, config.region),
		stringToSign,
	);
	return {
		url,
		headers: {
			...headers,
			Authorization: `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
		},
	};
}

export function presignUrl(
	config: S3Config,
	objectKey: string,
	expiresInSeconds: number,
	method: "GET" | "PUT" = "GET",
	contentType?: string,
) {
	const now = new Date();
	const amzDate = amzTimestamp(now);
	const dateStamp = amzDate.slice(0, 8);
	const { canonicalUri, host, url } = s3ObjectAddress(config, objectKey);
	const credentialScope = `${dateStamp}/${config.region}/s3/aws4_request`;
	const query = new URLSearchParams({
		"X-Amz-Algorithm": "AWS4-HMAC-SHA256",
		"X-Amz-Credential": `${config.accessKeyId}/${credentialScope}`,
		"X-Amz-Date": amzDate,
		"X-Amz-Expires": String(expiresInSeconds),
		"X-Amz-SignedHeaders": contentType ? "content-type;host" : "host",
	});
	const canonicalRequest = [
		method,
		canonicalUri,
		query.toString(),
		contentType
			? `content-type:${contentType}\nhost:${host}\n`
			: `host:${host}\n`,
		contentType ? "content-type;host" : "host",
		"UNSIGNED-PAYLOAD",
	].join("\n");
	const stringToSign = [
		"AWS4-HMAC-SHA256",
		amzDate,
		credentialScope,
		sha256Hex(canonicalRequest),
	].join("\n");
	const signature = hmacHex(
		signingKey(config.secretAccessKey, dateStamp, config.region),
		stringToSign,
	);
	return `${url}?${query.toString()}&X-Amz-Signature=${signature}`;
}

function signingKey(
	secretAccessKey: string,
	dateStamp: string,
	region: string,
) {
	const dateKey = createHmac("sha256", `AWS4${secretAccessKey}`)
		.update(dateStamp)
		.digest();
	const regionKey = createHmac("sha256", dateKey).update(region).digest();
	const serviceKey = createHmac("sha256", regionKey).update("s3").digest();
	return createHmac("sha256", serviceKey).update("aws4_request").digest();
}

function hmacHex(key: Buffer, value: string) {
	return createHmac("sha256", key).update(value).digest("hex");
}

function sha256Hex(value: Buffer | string) {
	return createHash("sha256").update(value).digest("hex");
}

function amzTimestamp(date: Date) {
	return `${date.toISOString().replace(/[:-]|\.\d{3}/g, "")}`;
}

function encodePath(objectKey: string) {
	return objectKey.split("/").map(encodeURIComponent).join("/");
}
