// /api/plushies/index.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

/** ---------- config & tiny helpers (inline to avoid import path issues) ---------- */

const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID ?? "";
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME ?? ""; // table NAME or tblXXXXXXXX id
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY ?? "";
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? "*";

const AIRTABLE_API = AIRTABLE_BASE_ID && AIRTABLE_TABLE_NAME
  ? `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`
  : "" as const;

type AirtableRecord<T = any> = { id: string; createdTime: string; fields: T };
type AirtableListResponse<T = any> = { records: AirtableRecord<T>[]; offset?: string };

type PlushieDay = {
  id?: string;
  dateKey: string;   // 'YYYY-MM-DD' (formula field in your base)
  date?: string;     // Airtable date field (optional)
  count: number;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

function cors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,x-edit-key");
}

function toPlushieDay(rec: AirtableRecord<any>): PlushieDay {
  return {
    id: rec.id,
    dateKey: String(rec.fields.dateKey ?? ""),
    date: rec.fields.date,
    count: Number(rec.fields.count ?? 0),
    notes: rec.fields.notes ?? null,
    createdAt: rec.fields.createdAt ?? rec.createdTime,
    updatedAt: rec.fields.updatedAt ?? rec.fields["Last Modified"] ?? undefined,
  };
}

function buildFilterByFormula(from?: string, to?: string) {
  if (from && to) return `AND({dateKey} >= "${from}", {dateKey} <= "${to}")`;
  if (from) return `({dateKey} >= "${from}")`;
  return undefined;
}

/** ---------------------------------- handler ---------------------------------- */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS preflight
  if (req.method === "OPTIONS") {
    cors(res);
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  cors(res);

  // Env guardrails (404 comes from missing function; we want explicit 500s if envs are missing)
  if (!AIRTABLE_BASE_ID || !AIRTABLE_TABLE_NAME || !AIRTABLE_API_KEY) {
    return res.status(500).json({
      error: "missing_env",
      detail: {
        AIRTABLE_BASE_ID: !!AIRTABLE_BASE_ID,
        AIRTABLE_TABLE_NAME: !!AIRTABLE_TABLE_NAME,
        AIRTABLE_API_KEY: !!AIRTABLE_API_KEY,
      },
    });
  }

  const { from, to } = (req.query ?? {}) as { from?: string; to?: string };
  const filterByFormula = buildFilterByFormula(from, to);

  try {
    const all: PlushieDay[] = [];
    let offset: string | undefined;

    do {
      const url = new URL(AIRTABLE_API);
      if (filterByFormula) url.searchParams.set("filterByFormula", filterByFormula);
      url.searchParams.set("pageSize", "100");
      url.searchParams.set("sort[0][field]", "dateKey");
      url.searchParams.set("sort[0][direction]", "asc");
      if (offset) url.searchParams.set("offset", offset);

      const resp = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
      });

      if (!resp.ok) {
        const text = await resp.text();
        // Surface Airtable's error body for easier debugging
        return res.status(502).json({ error: "airtable_error", detail: text });
      }

      const json = (await resp.json()) as AirtableListResponse<any>;
      for (const rec of json.records) all.push(toPlushieDay(rec));
      offset = json.offset;
    } while (offset);

    return res.status(200).json({ records: all });
  } catch (err: any) {
    return res.status(500).json({ error: "server_error", detail: err?.message ?? String(err) });
  }
}
