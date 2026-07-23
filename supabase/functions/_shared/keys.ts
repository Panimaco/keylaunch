const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateKeySegment(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => CHARSET[b % CHARSET.length]).join('');
}

export function generateKeyCode(): string {
  return [5, 5, 5].map((len) => generateKeySegment(len)).join('-');
}

export async function hashKeyCode(code: string): Promise<string> {
  const normalized = code.replace(/[\s-]/g, '').toUpperCase();
  const data = new TextEncoder().encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function keyPrefix(code: string): string {
  const normalized = code.replace(/[\s-]/g, '').toUpperCase();
  return normalized.slice(0, 5) + '*****';
}
