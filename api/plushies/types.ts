// /api/drops/types.ts

import type { VercelResponse } from '@vercel/node';

/** ===== Public types your client/UI may also mirror ===== */

export interface PlushieDay {
  id?: string;
  /** Canonical day key, e.g. '2025-09-04' (from Airtable formula field dateKey) */
  dateKey: string;
  /** Original Airtable date field (ISO date string or 'YYYY-MM-DD' when date-only) */
  date?: string;
  /** Non-negative integer count for the day */
  count: number;
  /** Optional freeform notes */
  notes?: string | null;
  /** Timestamps (ISO) */
  createdAt?: string;
  updatedAt?: string;
}

/** ===== Airtable response shapes ===== */

export interface AirtableRecord<T = any> {
  id: string;
  createdTime: string; // ISO timestamp
  fields: T;
}

export interface AirtableListResponse<T = any> {
  records: AirtableRecord<T>[];
  offset?: string;
}

/** Fields we store on the Airtable 'drops' table */
export interface AirtablePlushieFields {
  date?: string | Date;
  dateKey: string;         // 'YYYY-MM-DD'
  count: number;
  notes?: string;
  createdAt?: string;      // Created time (auto)
  updatedAt?: string;      // Last modified time (auto)
}

/** ===== Environment/config helpers ===== */

const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;
const API_KEY = process.env.AIRTABLE_API_KEY;

if (!BASE_ID || !TABLE_NAME || !API_KEY) {
  // Don’t throw here (Vercel may evaluate at import time); your route can still respond 500 gracefully.
  // You can optionally log a warning:
  // console.warn('Missing Airtable env vars: AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME, AIRTABLE_API_KEY');
}

export const AIRTABLE_API = `https://api.airtable.com/v0/${BASE_ID ?? ''}/${encodeURIComponent(
  TABLE_NAME ?? '',
)}`;

export const AUTH_HEADER: Record<string, string> = {
  Authorization: `Bearer ${API_KEY ?? ''}`,
  'Content-Type': 'application/json',
};

/** ===== Small utilities shared by both routes ===== */

export function cors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN ?? '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-edit-key');
}

export function methodNotAllowed(res: VercelResponse, allow: string) {
  res.setHeader('Allow', allow);
  return res.status(405).json({ error: 'method_not_allowed' });
}

export function badRequest(res: VercelResponse, message: string) {
  return res.status(400).json({ error: 'bad_request', message });
}

export function unauthorized(res: VercelResponse) {
  return res.status(401).json({ error: 'unauthorized' });
}

export function serverError(res: VercelResponse, err: unknown) {
  const detail = err instanceof Error ? err.message : String(err);
  return res.status(500).json({ error: 'server_error', detail });
}

export function airtableError(res: VercelResponse, which: string, detail: string) {
  return res.status(502).json({ error: `airtable_${which}_error`, detail });
}

/** Guard: counts are integers >= 0 */
export function clampNonNegative(n: number) {
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

/** Map raw Airtable record to our PlushieDay domain shape */
export function toPlushieDay(rec: AirtableRecord<any>): PlushieDay {
  return {
    id: rec.id,
    dateKey: rec.fields.dateKey,
    date: rec.fields.date,
    count: Number(rec.fields.count ?? 0),
    notes: rec.fields.notes ?? null,
    createdAt: rec.fields.createdAt ?? rec.createdTime,
    updatedAt: rec.fields.updatedAt ?? rec.fields['Last Modified'] ?? undefined,
  };
}

/** Build a filterByFormula for optional dateKey ranges */
export function buildFilterByFormula(from?: string, to?: string): string | undefined {
  if (from && to) return `AND({dateKey} >= "${from}", {dateKey} <= "${to}")`;
  if (from) return `({dateKey} >= "${from}")`;
  return undefined;
}

/** Validate YYYY-MM-DD (simple sanity check) */
export function isDateKey(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}
