import { sendFetchMessage } from "./chrome-message";

const LEETIFY_API_BASE = "https://cs2-lens-proxy.vercel.app/api/leetify";

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
  const url = `${LEETIFY_API_BASE}/profile?steam64_id=${steamId64}`;
  const json = await sendFetchMessage(url);
  if (!json) return null;

  try {
    const data = JSON.parse(json);
    const rating = data.rating;

    return {
      name: data.name ?? null,
      aim: rating?.aim ?? null,
      positioning: rating?.positioning ?? null,
      utility: rating?.utility ?? null,
      clutch: rating?.clutch ?? null,
      opening: rating?.opening ?? null,
      leetifyRating: data.ranks.leetify ?? null,
    };
  } catch {
    return null;
  }
}
