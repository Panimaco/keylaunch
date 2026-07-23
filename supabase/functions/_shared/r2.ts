import { AwsClient } from 'https://esm.sh/aws4fetch@1.0.18';

function getR2Client() {
  const accountId = Deno.env.get('R2_ACCOUNT_ID')!;
  return new AwsClient({
    accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID')!,
    secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY')!,
  });
}

function getR2Endpoint() {
  return `https://${Deno.env.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`;
}

export async function getPresignedUploadUrl(
  storageKey: string,
  contentType: string,
  expiresIn = 3600,
): Promise<string> {
  const client = getR2Client();
  const bucket = Deno.env.get('R2_BUCKET_NAME')!;
  const url = `${getR2Endpoint()}/${bucket}/${storageKey}?X-Amz-Expires=${expiresIn}`;
  const signed = await client.sign(new Request(url, { method: 'PUT', headers: { 'Content-Type': contentType } }), {
    aws: { signQuery: true, service: 's3' },
  });
  return signed.url;
}

export async function getPresignedDownloadUrl(
  storageKey: string,
  expiresIn = 3600,
): Promise<string> {
  const client = getR2Client();
  const bucket = Deno.env.get('R2_BUCKET_NAME')!;
  const url = `${getR2Endpoint()}/${bucket}/${storageKey}?X-Amz-Expires=${expiresIn}`;
  const signed = await client.sign(new Request(url, { method: 'GET' }), {
    aws: { signQuery: true, service: 's3' },
  });
  return signed.url;
}

export function buildStorageKey(projectId: string, versionNumber: number): string {
  return `projects/${projectId}/v${versionNumber}.zip`;
}
