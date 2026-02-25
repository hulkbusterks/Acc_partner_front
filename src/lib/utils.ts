import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Decode a JWT payload (no verification — just base64) */
export function decodeJwt(token: string): Record<string, unknown> {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return {};
  }
}

/** Check if a JWT is expired */
export function isJwtExpired(token: string): boolean {
  const payload = decodeJwt(token);
  if (typeof payload.exp !== 'number') return true;
  return Date.now() >= payload.exp * 1000;
}

/** Minutes until JWT expiry */
export function jwtMinutesRemaining(token: string): number {
  const payload = decodeJwt(token);
  if (typeof payload.exp !== 'number') return 0;
  return Math.max(0, Math.floor((payload.exp * 1000 - Date.now()) / 60_000));
}

/** Format seconds as mm:ss */
export function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/** Format a date string to human-readable */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Generate rank label */
export function rankLabel(index: number): string {
  if (index === 0) return '🥇';
  if (index === 1) return '🥈';
  if (index === 2) return '🥉';
  return `#${index + 1}`;
}
