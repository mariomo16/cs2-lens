const FACEIT_API_BASE = "https://cs2-lens-proxy.vercel.app/api/faceit";

export interface FaceitStats {
  level: number | null;
  elo: number | null;
  regional_rank: number | null;
  nickname: string | null;
  country: string | null;
  verified: boolean;
}

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

export async function fetchFaceitStats(
  steamId64: string,
): Promise<FaceitStats | null> {
  const playerJson = await sendFetchMessage(
    `${FACEIT_API_BASE}/players?game=cs2&game_player_id=${steamId64}`,
  );
  if (!playerJson) return null;

  try {
    const player = JSON.parse(playerJson);
    const playerId: string | undefined = player?.player_id;
    const nickname: string | null = player?.nickname ?? null;
    const country: string | null = player?.country ?? null;
    const verified: boolean = !!player?.verified;
    const cs2 = player?.games?.cs2;
    const level: number | null = cs2?.skill_level ?? null;
    const elo: number | null = cs2?.faceit_elo ?? null;
    const region: string | null = cs2?.region ?? null;

    if (!playerId && !elo) return null;

    let regional_rank: number | null = null;
    if (playerId && region && level === 10) {
      const rankJson = await sendFetchMessage(
        `${FACEIT_API_BASE}/rankings/games/cs2/regions/${region}/players/${playerId}`,
      );
      if (rankJson) {
        try {
          const rankData = JSON.parse(rankJson);
          regional_rank = rankData?.position ?? null;
        } catch {}
      }
    }

    return { level, elo, regional_rank, nickname, country, verified };
  } catch {}

  return null;
}
