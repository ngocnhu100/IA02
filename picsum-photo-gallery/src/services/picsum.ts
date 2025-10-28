import type { Photo } from "../types/photos";

const BASE = "https://picsum.photos"; // Base URL for Picsum API

/**
 * Fetch with simple retry and linear backoff.
 * @param input Request URL or Request
 * @param init Fetch init
 * @param retries Number of retry attempts
 * @param backoffMs Base backoff in ms (multiplied by attempt index)
 */
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
        // Use CORS with default cache; callers can override via init
        mode: "cors",
        cache: "default",
        ...init,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (e) {
      lastErr = e;
      if (attempt === retries) break;
      // Linear backoff: 1x, 2x, ... backoffMs
      await new Promise((r) => setTimeout(r, backoffMs * (attempt + 1)));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Network error");
}

/**
 * Get a page of photos (paginated).
 * Returns lightweight list items used by gallery.
 */
export async function getPhotosPage(
  page: number,
  limit = 36,
  signal?: AbortSignal
): Promise<Photo[]> {
  const res = await fetchWithRetry(
    `${BASE}/v2/list?page=${page}&limit=${limit}`,
    { signal }
  );
  return res.json(); // List of Photo metadata
}

/**
 * Get details for a single photo (full metadata).
 */
export async function getPhotoInfo(
  id: string,
  signal?: AbortSignal
): Promise<Photo> {
  const res = await fetchWithRetry(`${BASE}/id/${id}/info`, { signal });
  return res.json();
}
