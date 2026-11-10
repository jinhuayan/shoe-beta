import "server-only";

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

let cached: ReturnType<typeof createStorage> | undefined;

function storage() { return cached ??= createStorage(); }

function createStorage() {
  const endpoint = process.env.SPACES_ENDPOINT?.trim();
  const bucket = process.env.SPACES_BUCKET?.trim();
  const accessKeyId = process.env.SPACES_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.SPACES_SECRET_ACCESS_KEY?.trim();
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) throw new Error("Configure Spaces before using photos.");
  const url = new URL(endpoint);
  const local = url.protocol === "http:" && ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
  if ((!local && url.protocol !== "https:") || url.username || url.password || url.pathname !== "/" || url.search || url.hash) throw new Error("Invalid Spaces endpoint.");
  return {
    bucket,
    client: new S3Client({
      endpoint: url.origin, region: "us-east-1", forcePathStyle: local,
      credentials: { accessKeyId, secretAccessKey }, maxAttempts: 2,
      requestHandler: { connectionTimeout: 3000, requestTimeout: 10000 },
      requestChecksumCalculation: "WHEN_REQUIRED", responseChecksumValidation: "WHEN_REQUIRED",
    }),
  };
}

export async function putPhoto(key: string, bytes: Uint8Array, contentType: string) {
  const { client, bucket } = storage();
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: bytes, ContentType: contentType, ACL: "private" }));
}

export async function getPhoto(key: string) {
  const { client, bucket } = storage();
  const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!result.Body) throw new Error("Photo body is missing.");
  return result.Body.transformToByteArray();
}

export async function deletePhoto(key: string) {
  const { client, bucket } = storage();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
