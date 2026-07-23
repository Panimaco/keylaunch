const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

async function callFunction<T>(name: string, body: unknown): Promise<T> {
  const res = await fetch(`${FUNCTIONS_URL}/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API error');
  return data as T;
}

export interface ActivateResult {
  activation_id: string;
  project: {
    id: string;
    name: string;
    description: string | null;
    icon_url: string | null;
    executable_path: string;
  };
}

export interface LibraryItem {
  activation_id: string;
  project: {
    id: string;
    name: string;
    description: string | null;
    icon_url: string | null;
    executable_path: string;
  };
  status: 'active' | 'revoked';
  installed_version_id: string | null;
  versions: {
    id: string;
    version_number: number;
    selectable: boolean;
    is_latest: boolean;
    scan_status: string;
  }[];
}

export async function activateKey(
  code: string,
  deviceName: string,
  deviceFingerprint: string,
) {
  return callFunction<ActivateResult>('activate-key', {
    code,
    device_name: deviceName,
    device_fingerprint: deviceFingerprint,
  });
}

export async function checkAccess(activationId: string, deviceFingerprint: string) {
  return callFunction<{ allowed: boolean; reason?: string }>('check-access', {
    activation_id: activationId,
    device_fingerprint: deviceFingerprint,
  });
}

export async function getLibrary(activationIds: string[]) {
  return callFunction<{ library: LibraryItem[] }>('get-library', {
    activation_ids: activationIds,
  });
}

export async function getDownloadUrl(
  activationId: string,
  versionId: string,
  deviceFingerprint: string,
) {
  return callFunction<{ url: string; sha256: string; expires_at: string }>(
    'get-download-url',
    { activation_id: activationId, version_id: versionId, device_fingerprint: deviceFingerprint },
  );
}

export async function submitComment(
  activationId: string,
  body: string,
  deviceFingerprint: string,
  versionId?: string,
) {
  return callFunction<{ sent: boolean }>('submit-comment', {
    activation_id: activationId,
    body,
    device_fingerprint: deviceFingerprint,
    version_id: versionId,
  });
}
