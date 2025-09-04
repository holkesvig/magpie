import type { VercelRequest, VercelResponse } from '@vercel/node';
// import type { AirtableListResponse, PlushieDay } from '../types';
// import { cors, AUTH_HEADER, AIRTABLE_API, toPlushieDay } from '../types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    cors(res);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    return res.status(204).end();
  }
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });

  cors(res);

  const { from, to } = req.query as { from?: string; to?: string };

  // Build filterByFormula
  // let filterByFormula = '';
  // if (from && to) filterByFormula = `AND({dateKey} >= "${from}", {dateKey} <= "${to}")`;
  // else if (from) filterByFormula = `({dateKey} >= "${from}")`;
  // else: no filter (returns all)

  const params = new URLSearchParams();
  // if (filterByFormula) params.set('filterByFormula', filterByFormula);
  params.set('pageSize', '100');
  params.set('sort[0][field]', 'dateKey');
  params.set('sort[0][direction]', 'asc');

  try {
    const all: PlushieDay[] = [];
    let offset: string | undefined = undefined;

    do {
      const url = new URL(AIRTABLE_API + (params.toString() ? `?${params.toString()}` : ''));
      if (offset) url.searchParams.set('offset', offset);

      const resp = await fetch(url.toString(), { headers: AUTH_HEADER });
      if (!resp.ok) {
        const text = await resp.text();
        return res.status(502).json({ error: 'airtable_error', detail: text });
      }

      const json = (await resp.json()) as AirtableListResponse<any>;
      for (const rec of json.records) all.push(toPlushieDay(rec));
      offset = json.offset;
    } while (offset);

    return res.status(200).json({ records: all });
  } catch (err: any) {
    return res.status(500).json({ error: 'server_error', detail: err?.message ?? String(err) });
  }
}

/**
 * Tiny local type re-exports so the file is self-contained if you don't want a separate module.
 * If you prefer, move these helpers into /api/_airtable.ts and import them instead.
 */
// ---- inline helpers (duplicate minimal set to keep file standalone) ----
interface AirtableRecord<T = any> { id: string; createdTime: string; fields: T; }
interface AirtableListResponse<T = any> { records: AirtableRecord<T>[]; offset?: string; }
interface PlushieDay { id?: string; dateKey: string; date?: string; count: number; notes?: string | null; createdAt?: string; updatedAt?: string; }
const AIRTABLE_API = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(process.env.AIRTABLE_TABLE_NAME ?? '')}`;
const AUTH_HEADER = { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}` };
function cors(res: VercelResponse){ res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN ?? '*'); res.setHeader('Access-Control-Allow-Headers','Content-Type,x-edit-key');}
function toPlushieDay(rec: AirtableRecord<any>): PlushieDay { return { id: rec.id, dateKey: rec.fields.dateKey, date: rec.fields.date, count: Number(rec.fields.count ?? 0), notes: rec.fields.notes ?? null, createdAt: rec.fields.createdAt ?? rec.createdTime, updatedAt: rec.fields.updatedAt ?? rec.fields['Last Modified'] ?? undefined }; }
