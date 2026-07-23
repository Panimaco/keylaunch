import { createClient } from './supabase/client';

const FUNCTIONS_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1`;

async function callFunction<T>(
  name: string,
  body: unknown,
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${FUNCTIONS_URL}/${name}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API error');
  return data as T;
}

export async function getAuthToken() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
}

export async function generateKeys(projectId: string, count: number) {
  const token = await getAuthToken();
  return callFunction<{ keys: string[] }>('generate-keys', { project_id: projectId, count }, token);
}

export async function getUploadUrl(
  projectId: string,
  fileSizeBytes: number,
  sha256: string,
) {
  const token = await getAuthToken();
  return callFunction<{
    upload_url: string;
    storage_key: string;
    version_number: number;
    sha256: string;
  }>('get-upload-url', {
    project_id: projectId,
    file_size_bytes: fileSizeBytes,
    sha256,
  }, token);
}

export async function completeUpload(params: {
  project_id: string;
  storage_key: string;
  version_number: number;
  sha256: string;
  file_size_bytes: number;
  changelog?: string;
}) {
  const token = await getAuthToken();
  return callFunction<{ version_id: string; scan_status: string }>(
    'complete-upload',
    params,
    token,
  );
}

export async function revokeActivation(activationId: string) {
  const token = await getAuthToken();
  return callFunction<{ revoked: boolean }>(
    'revoke-activation',
    { activation_id: activationId },
    token,
  );
}

export async function triggerScanQueue() {
  return callFunction<{ processed: number }>('process-scan-queue', {});
}

export async function computeSha256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function uploadBuild(
  projectId: string,
  file: File,
  changelog?: string,
) {
  const sha256 = await computeSha256(file);
  const { upload_url, storage_key, version_number } = await getUploadUrl(
    projectId,
    file.size,
    sha256,
  );

  const uploadRes = await fetch(upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/zip' },
    body: file,
  });

  if (!uploadRes.ok) throw new Error('Upload to storage failed');

  return completeUpload({
    project_id: projectId,
    storage_key,
    version_number,
    sha256,
    file_size_bytes: file.size,
    changelog,
  });
}
