import type { VercelRequest, VercelResponse } from "@vercel/node";

const ALLOWED_ORIGIN = (process.env.ALLOWED_ORIGIN ?? "*").trim();
const VIEW_KEY = (process.env.VIEW_KEY ?? "").trim();

function cors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,x-view-key");
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    cors(res);
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    return res.status(204).end();
  }
  if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });

  cors(res);

  const headerKey = String(req.headers["x-view-key"] ?? "").trim();
  if (!VIEW_KEY || headerKey !== VIEW_KEY) {
    return res.status(401).json({ error: "unauthorized" });
  }

  return res.status(200).json({ ok: true });
}
