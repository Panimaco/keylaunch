export type ScanStatus = 'pending_scan' | 'scanning' | 'clean' | 'infected' | 'rejected';
export type KeyStatus = 'available' | 'used' | 'revoked';
export type ActivationStatus = 'active' | 'revoked';

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  creator_id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  executable_path: string;
  created_at: string;
  updated_at: string;
}

export interface Version {
  id: string;
  project_id: string;
  version_number: number;
  changelog: string | null;
  storage_key: string;
  sha256: string;
  file_size_bytes: number;
  selectable: boolean;
  is_latest: boolean;
  scan_status: ScanStatus;
  vt_report_url: string | null;
  created_at: string;
}

export interface AccessKey {
  id: string;
  project_id: string;
  code_prefix: string;
  status: KeyStatus;
  created_at: string;
}

export interface Activation {
  id: string;
  key_id: string;
  project_id: string;
  device_name: string;
  device_fingerprint: string;
  installed_version_id: string | null;
  status: ActivationStatus;
  activated_at: string;
  revoked_at: string | null;
}

export interface Comment {
  id: string;
  project_id: string;
  activation_id: string;
  version_id: string | null;
  body: string;
  created_at: string;
}

export interface ScanJob {
  id: string;
  version_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  attempts: number;
  error_message: string | null;
  created_at: string;
}

// API request/response types
export interface CreateProjectRequest {
  name: string;
  description?: string;
  executable_path: string;
}

export interface GenerateKeysRequest {
  project_id: string;
  count: number;
}

export interface GenerateKeysResponse {
  keys: string[];
}

export interface ActivateKeyRequest {
  code: string;
  device_name: string;
  device_fingerprint: string;
}

export interface ActivateKeyResponse {
  activation_id: string;
  project: Pick<Project, 'id' | 'name' | 'description' | 'icon_url' | 'executable_path'>;
}

export interface CheckAccessRequest {
  activation_id: string;
  device_fingerprint: string;
}

export interface CheckAccessResponse {
  allowed: boolean;
  reason?: string;
  project?: Pick<Project, 'id' | 'name' | 'executable_path'>;
}

export interface DownloadUrlRequest {
  activation_id: string;
  version_id: string;
  device_fingerprint: string;
}

export interface DownloadUrlResponse {
  url: string;
  sha256: string;
  expires_at: string;
}

export interface SubmitCommentRequest {
  activation_id: string;
  version_id?: string;
  body: string;
  device_fingerprint: string;
}

export interface LibraryProject {
  activation_id: string;
  project: Pick<Project, 'id' | 'name' | 'description' | 'icon_url' | 'executable_path'>;
  status: ActivationStatus;
  installed_version_id: string | null;
  versions: Pick<Version, 'id' | 'version_number' | 'selectable' | 'is_latest' | 'scan_status'>[];
}

// Limits (from docs/LIMITS.md)
export const LIMITS = {
  MAX_PROJECTS_PER_CREATOR: 3,
  MAX_STORAGE_BYTES_PER_PROJECT: 2 * 1024 * 1024 * 1024,
  MAX_TOTAL_STORAGE_BYTES: 6 * 1024 * 1024 * 1024,
  MAX_KEYS_PER_PROJECT: 200,
  MAX_ACTIVE_ACTIVATIONS_PER_PROJECT: 50,
  MAX_VERSIONS_PER_PROJECT: 20,
  MAX_ZIP_SIZE_BYTES: 2 * 1024 * 1024 * 1024,
  COMMENT_RATE_LIMIT_SECONDS: 600,
  KEY_CODE_SEGMENTS: 3,
  KEY_SEGMENT_LENGTH: 5,
} as const;

export function formatKeyCode(segments: string[]): string {
  return segments.join('-').toUpperCase();
}

export function parseKeyCode(code: string): string {
  return code.replace(/[\s-]/g, '').toUpperCase();
}
