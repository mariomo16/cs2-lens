import { sendFetchMessage } from "./chrome-message";

const FACEIT_API_BASE = "https://cs2-lens-proxy.vercel.app/api/faceit";

export interface FaceitStats {
  level: number | null;
  elo: number | null;
  regional_rank: number | null;
  nickname: string | null;
  country: string | null;
  verified: boolean;
  hsPercent: number | null;
  kdRatio: number | null;
  winRate: number | null;
  matches: number | null;
  adr: number | null;
  last5: string[];
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

    let hsPercent: number | null = null;
    let kdRatio: number | null = null;
    let winRate: number | null = null;
    let matches: number | null = null;
    let adr: number | null = null;
    let last5: string[] = [];

    if (playerId) {
      const statsJson = await sendFetchMessage(
        `${FACEIT_API_BASE}/players/${playerId}/stats/cs2`,
      );
      if (statsJson) {
        try {
          const stats = JSON.parse(statsJson);
          const lifetime = stats.lifetime;
          hsPercent = lifetime?.["Average Headshots %"] ?? null;
          kdRatio = lifetime?.["Average K/D Ratio"] ?? null;
          winRate = lifetime?.["Win Rate %"] ?? null;
          matches = lifetime?.["Total Matches"] ?? null;
          adr = lifetime?.ADR ?? null;
          last5 = (lifetime?.["Recent Results"] ?? [])
            .map((r: unknown) => (String(r) === "1" ? "W" : "L"))
            .reverse();
        } catch {}
      }
    }

    return {
      level,
      elo,
      regional_rank,
      nickname,
      country,
      verified,
      hsPercent,
      kdRatio,
      winRate,
      matches,
      adr,
      last5,
    };
  } catch {}

  return null;
}
