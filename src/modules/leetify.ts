const LEETIFY_API_BASE = "https://api-public.cs-prod.leetify.com";

function sendFetchMessage(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: "FETCH", url },
      (response: { ok: boolean; body?: string }) => {
        if (chrome.runtime.lastError || !response?.ok) {
          resolve(null);
        } else {
          resolve(response.body ?? null);
        }
      },
    );
  });
}

export interface LeetifyStats {
  name: string | null;
  aim: number | null;
  utility: number | null;
  positioning: number | null;
  clutch: number | null;
  opening: number | null;
  leetifyRating: number | null;
}

export async function fetchLeetifyStats(
  steamId64: string,
): Promise<LeetifyStats | null> {
  const url = `${LEETIFY_API_BASE}/v3/profile?steam64_id=${steamId64}`;
  const json = await sendFetchMessage(url);
  if (!json) return null;

  try {
    const data = JSON.parse(json);
    const s = data.rating;

    return {
      name: data.name ?? null,
      aim: s?.aim ?? null,
      positioning: s?.positioning ?? null,
      utility: s?.utility ?? null,
      clutch: s?.clutch ?? null,
      opening: s?.opening ?? null,
      leetifyRating: data.ranks.leetify ?? null,
    };
  } catch {
    return null;
  }
}
