// /api/drops/[dateKey].ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

interface AirtableRecord<T = any> { id: string; createdTime: string; fields: T }
interface AirtableListResponse<T = any> { records: AirtableRecord<T>[]; offset?: string }

const AIRTABLE_BASE_ID  = (process.env.AIRTABLE_BASE_ID ?? "").trim();
const TABLE_IDENT       = (process.env.AIRTABLE_TABLE_ID ?? process.env.AIRTABLE_TABLE_NAME ?? "").trim(); // id or name
const AIRTABLE_API_KEY  = (process.env.AIRTABLE_API_KEY ?? "").trim();
const ALLOWED_ORIGIN    = (process.env.ALLOWED_ORIGIN ?? "*").trim();
const EDIT_KEY          = (process.env.EDIT_KEY ?? "").trim();
const TIMEZONE          = "America/Chicago";

const AIRTABLE_API = AIRTABLE_BASE_ID && TABLE_IDENT
  ? `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_IDENT)}`
  : "";

const AUTH_HEADER = {
  Authorization: `Bearer ${AIRTABLE_API_KEY}`,
  "Content-Type": "application/json",
} as const;

function cors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,x-edit-key");
}

function clampNonNegative(n: number) {
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

function toPlushieDay(rec: AirtableRecord<any>) {
  return {
    id: rec.id,
    dateKey: rec.fields.dateKey, // computed by Airtable
    date: rec.fields.date,
    count: Number(rec.fields.count ?? 0),
    notes: rec.fields.notes ?? null,
    createdAt: rec.fields.createdAt ?? rec.createdTime,
    updatedAt: rec.fields.updatedAt ?? rec.fields["Last Modified"] ?? undefined,
  };
}

/** Prefer matching the real {date} field; fall back to {dateKey} text equality if needed. */
function buildDateEqualsFormula(dateKey: string) {
  const primary  = `IS_SAME(SET_TIMEZONE({date}, "${TIMEZONE}"), DATETIME_PARSE("${dateKey}"), 'day')`;
  const fallback = `{dateKey} = "${dateKey}"`;
  return { primary, fallback };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    cors(res);
    res.setHeader("Access-Control-Allow-Methods", "PUT,OPTIONS");
    return res.status(204).end();
  }
  if (req.method !== "PUT") return res.status(405).json({ error: "method_not_allowed" });

  cors(res);

  // Env guard
  if (!AIRTABLE_API || !AIRTABLE_API_KEY) {
    return res.status(500).json({
      error: "missing_env",
      detail: {
        AIRTABLE_BASE_ID: Boolean(AIRTABLE_BASE_ID),
        AIRTABLE_TABLE_IDENT: Boolean(TABLE_IDENT),
        AIRTABLE_API_KEY: Boolean(AIRTABLE_API_KEY),
      },
    });
  }

  // Edit gate
  const editKey = String(req.headers["x-edit-key"] ?? "");
  if (!EDIT_KEY || editKey !== EDIT_KEY) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const { dateKey } = req.query as { dateKey: string };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return res.status(400).json({ error: "invalid_dateKey" });
  }

  const body = (typeof req.body === "string" ? JSON.parse(req.body) : req.body) ?? {};
  const hasDelta = typeof body?.delta === "number";
  const hasCount = typeof body?.count === "number";
  const notes = typeof body?.notes === "string" ? body.notes : undefined;

  if (!hasDelta && !hasCount) {
    return res.status(400).json({ error: "missing_delta_or_count" });
  }

  try {
    // 1) Find existing record for that calendar day
    const { primary, fallback } = buildDateEqualsFormula(dateKey);

    const trySearch = async (formula: string) => {
      const sp = new URLSearchParams();
      sp.set("pageSize", "1");
      sp.set("filterByFormula", formula);
      return fetch(`${AIRTABLE_API}?${sp.toString()}`, {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
      });
    };

    let findResp = await trySearch(primary);
    if (!findResp.ok) findResp = await trySearch(fallback);

    if (!findResp.ok) {
      const t = await findResp.text();
      return res.status(502).json({ error: "airtable_search_error", detail: t });
    }

    const found = (await findResp.json()) as AirtableListResponse<any>;
    const existing = found.records?.[0];

    // 2) Compute the next count
    let nextCount: number;
    if (existing) {
      const current = Number(existing.fields.count ?? 0);
      nextCount = hasDelta ? clampNonNegative(current + body.delta) : clampNonNegative(body.count);
    } else {
      nextCount = hasDelta ? clampNonNegative(body.delta) : clampNonNegative(body.count);
    }

    // 3) Create or update (DO NOT write to dateKey — it's computed)
    if (!existing) {
      const createBody = {
        records: [
          {
            fields: {
              date: dateKey,        // Date field
              // dateKey: (omit; computed)
              count: nextCount,
              ...(notes !== undefined ? { notes } : {}),
            },
          },
        ],
      };

      const createResp = await fetch(AIRTABLE_API, {
        method: "POST",
        headers: AUTH_HEADER,
        body: JSON.stringify(createBody),
      });
      if (!createResp.ok) {
        const t = await createResp.text();
        return res.status(502).json({ error: "airtable_create_error", detail: t });
      }
      const json = await createResp.json();
      return res.status(200).json({ record: toPlushieDay(json.records[0]) });
    } else {
      const updateBody = {
        records: [
          {
            id: existing.id,
            fields: {
              // dateKey: (omit; computed)
              count: nextCount,
              ...(notes !== undefined ? { notes } : {}),
            },
          },
        ],
      };

      const updateResp = await fetch(AIRTABLE_API, {
        method: "PATCH",
        headers: AUTH_HEADER,
        body: JSON.stringify(updateBody),
      });
      if (!updateResp.ok) {
        const t = await updateResp.text();
        return res.status(502).json({ error: "airtable_update_error", detail: t });
      }
      const json = await updateResp.json();
      return res.status(200).json({ record: toPlushieDay(json.records[0]) });
    }
  } catch (err: any) {
    return res.status(500).json({ error: "server_error", detail: err?.message ?? String(err) });
  }
}
