import type { Photo } from "../types/photos";

const BASE = "https://picsum.photos";

async function fetchWithRetry(
  input: RequestInfo | URL,
  init: RequestInit = {},
  retries = 2,
  backoffMs = 600
): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(input, {
        mode: "cors",
        cache: "default",
        ...init,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (e) {
      lastErr = e;
      if (attempt === retries) break;
      await new Promise((r) => setTimeout(r, backoffMs * (attempt + 1)));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Network error");
}

export async function getPhotosPage(
  page: number,
  limit = 30,
  signal?: AbortSignal
): Promise<Photo[]> {
  const res = await fetchWithRetry(
    `${BASE}/v2/list?page=${page}&limit=${limit}`,
    { signal }
  );
  return res.json();
}

export async function getPhotoInfo(
  id: string,
  signal?: AbortSignal
): Promise<Photo> {
  const res = await fetchWithRetry(`${BASE}/id/${id}/info`, { signal });
  return res.json();
}
