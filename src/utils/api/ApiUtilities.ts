export async function getWithViewKey<T>(url: string, viewKey: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      "x-view-key": viewKey,
    },
    credentials: "same-origin",
  });
  if (res.status === 401) {
    const err: any = new Error("unauthorized");
    err.status = 401;
    throw err;
  }
  if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function putWithKeys<T>(url: string, body: unknown, viewKey: string, editKey: string): Promise<T> {
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-view-key": viewKey, // optional if your PUTs also check view, but harmless
      "x-edit-key": editKey,
    },
    credentials: "same-origin",
    body: JSON.stringify(body),
  });
  if (res.status === 401) {
    const err: any = new Error("unauthorized");
    err.status = 401;
    throw err;
  }
  if (!res.ok) throw new Error(`PUT ${url} failed: ${res.status}`);
  return res.json() as Promise<T>;
}
