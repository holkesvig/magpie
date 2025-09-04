// Minimal types shared by the plushies routes
export interface PlushieDay {
    id?: string;
    dateKey: string;     // 'YYYY-MM-DD'
    date?: string;       // ISO or 'YYYY-MM-DD' (your Airtable date-only field)
    count: number;
    notes?: string | null;
    createdAt?: string;
    updatedAt?: string;
  }
  
  interface AirtableRecord<T = any> {
    id: string;
    createdTime: string;
    fields: T;
  }
  
  interface AirtableListResponse<T = any> {
    records: AirtableRecord<T>[];
    offset?: string;
  }
  
  const AIRTABLE_API = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(process.env.AIRTABLE_TABLE_NAME ?? '')}`;
  const AUTH_HEADER = { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}` };
  
  function toPlushieDay(rec: AirtableRecord<any>): PlushieDay {
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
  
  function cors(res: import('@vercel/node').VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN ?? '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-edit-key');
  }
  
  function badRequest(res: import('@vercel/node').VercelResponse, message: string) {
    return res.status(400).json({ error: message });
  }
  
  function unauthorized(res: import('@vercel/node').VercelResponse) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  
  function clampNonNegative(n: number) {
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  }
  