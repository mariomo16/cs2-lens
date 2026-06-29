const CSSTATS_BASE_URL = "https://csstats.gg/player";
const FACEIT_API_BASE = "https://cs2-lens-proxy.vercel.app/api/faceit";

export interface PremierRating {
	season: number;
	latestRating: number | null;
	bestRating: number | null;
	wins: number;
}

export interface FaceitStats {
	level: number | null;
	elo: number | null;
	regional_rank: number | null;
	nickname: string | null;
	country: string | null;
	verified: boolean;
}

export interface PlayerStats {
	premierRatings: PremierRating[];
	faceit: FaceitStats | null;
	kdRatio: number | null;
	hltvRating: number | null;
	matches: number | null;
	winRate: number | null;
	trackingDisabled: boolean;
	trackingInactive: boolean;
}

export type StatsResponse =
	| { ok: true; data: PlayerStats }
	| { ok: false; error: "private" | "not_found" | "fetch_failed" };

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
	console.log("[CS2 Lens] fetchFaceitStats steamId64:", steamId64);

	const playerJson = await sendFetchMessage(
		`${FACEIT_API_BASE}/players?game=cs2&game_player_id=${steamId64}`,
	);
	console.log("[CS2 Lens] /players raw response:", playerJson);
	if (!playerJson) {
		console.log("[CS2 Lens] /players returned null");
		return null;
	}

	try {
		const player = JSON.parse(playerJson);
		console.log("[CS2 Lens] /players parsed:", player);

		const playerId: string | undefined = player?.player_id;
		const nickname: string | null = player?.nickname ?? null;
		const country: string | null = player?.country ?? null;
		const verified: boolean = !!player?.verified;
		const cs2 = player?.games?.cs2;
		console.log("[CS2 Lens] cs2 games object:", cs2);

		const level: number | null = cs2?.skill_level ?? null;
		const elo: number | null = cs2?.faceit_elo ?? null;
		const region: string | null = cs2?.region ?? null;

		console.log(
			"[CS2 Lens] Extracted - level:",
			level,
			"elo:",
			elo,
			"region:",
			region,
			"playerId:",
			playerId,
		);

		if (!playerId && !elo) {
			console.log("[CS2 Lens] No playerId and no elo, returning null");
			return null;
		}

		let regional_rank: number | null = null;
		if (playerId && region && level === 10) {
			console.log(
				"[CS2 Lens] Fetching regional rank for:",
				playerId,
				"region:",
				region,
			);
			const rankJson = await sendFetchMessage(
				`${FACEIT_API_BASE}/rankings/games/cs2/regions/${region}/players/${playerId}`,
			);
			console.log("[CS2 Lens] /rankings raw response:", rankJson);
			if (rankJson) {
				try {
					const rankData = JSON.parse(rankJson);
					console.log("[CS2 Lens] /rankings parsed:", rankData);
					regional_rank = rankData?.position ?? null;
				} catch (e) {
					console.log("[CS2 Lens] /rankings parse error:", e);
				}
			}
		} else {
			console.log(
				"[CS2 Lens] Skipping rank fetch - playerId:",
				!!playerId,
				"region:",
				!!region,
				"level === 10:",
				level === 10,
			);
		}

		const result = { level, elo, regional_rank, nickname, country, verified };
		console.log("[CS2 Lens] Returning FaceitStats:", result);
		return result;
	} catch (e) {
		console.log("[CS2 Lens] /players parse error:", e);
	}

	return null;
}

export async function fetchPlayerStats(
	steamId64: string,
): Promise<StatsResponse> {
	const parser = new DOMParser();

	const [profileHtml, statsHtml] = await Promise.all([
		sendFetchMessage(`${CSSTATS_BASE_URL}/${steamId64}`),
		sendFetchMessage(`${CSSTATS_BASE_URL}/${steamId64}/stats`),
	]);

	if (!profileHtml) return { ok: false, error: "fetch_failed" };

	const profileDoc = parser.parseFromString(profileHtml, "text/html");

	if (
		profileDoc.querySelector("#outer-wrapper h1")?.textContent?.trim() ===
		"Private Profile"
	) {
		return { ok: false, error: "private" };
	}

	if (!statsHtml) return { ok: false, error: "fetch_failed" };

	const statsDoc = parser.parseFromString(statsHtml, "text/html");

	const trackingDisabled = [profileHtml, statsHtml].some((html) =>
		html?.toLowerCase().includes("tracking not enabled"),
	);

	const trackingInactive = [profileHtml, statsHtml].some((html) =>
		html?.toLowerCase().includes("tracking inactive"),
	);

	if (!statsDoc.querySelector(".content-sub-nav-outer")) {
		return { ok: false, error: "not_found" };
	}

	const kdRatio =
		parseFloat(
			statsDoc.querySelector("#kpd span")?.textContent?.trim() ?? "",
		) || null;

	const hltvRating =
		parseFloat(
			statsDoc.querySelector("#rating span")?.textContent?.trim() ?? "",
		) || null;

	const statPanels = statsDoc.querySelectorAll(".stat-panel");

	let winRate: number | null = null;
	let matches: number | null = null;
	const parsePanelValue = (panel: Element): number | null => {
		const el = panel.querySelector("[style*='font-size:34px']");
		if (!el) return null;
		const text = el.childNodes[0]?.textContent?.trim();
		return text ? parseInt(text, 10) : null;
	};

	statPanels.forEach((panel) => {
		const heading = panel.querySelector(".stat-heading")?.textContent?.trim();
		if (!heading) return;

		if (heading === "Win Rate") {
			winRate = parsePanelValue(panel);
			matches =
				parseInt(
					panel.querySelector(".total-value")?.textContent?.trim() ?? "",
					10,
				) || null;
		}
	});

	const parsePremierRating = (container: Element | null): number | null => {
		if (!container) return null;
		const span = container.querySelector(".cs2rating span");
		if (!span) return null;
		const main = span.childNodes[0]?.textContent?.trim() ?? "";
		if (!main || main === "---") return 0;
		const decimal =
			(span.querySelector("small") as HTMLElement | null)?.textContent
				?.trim()
				.replace(",", "") ?? "";
		return parseInt(main + decimal, 10) || null;
	};

	const premierRatings: PremierRating[] = [];

	profileDoc.querySelectorAll("#player-ranks .ranks").forEach((rankDiv) => {
		const icon = rankDiv.querySelector(".icon");
		if (!icon) return;

		const img = icon.querySelector("img");
		const alt = img?.getAttribute("alt") ?? "";

		if (!alt.startsWith("Premier")) return;

		const wins =
			parseInt(
				rankDiv.querySelector(".bottom .wins b")?.textContent?.trim() ?? "",
				10,
			) || 0;

		const seasonMatch = alt.match(/Season (\d+)/);
		premierRatings.push({
			season: seasonMatch ? parseInt(seasonMatch[1], 10) : 1,
			latestRating: parsePremierRating(rankDiv.querySelector(".rank")),
			bestRating: parsePremierRating(rankDiv.querySelector(".best")),
			wins,
		});
	});

	return {
		ok: true,
		data: {
			premierRatings,
			faceit: null,
			kdRatio,
			hltvRating,
			matches,
			winRate,
			trackingDisabled,
			trackingInactive,
		},
	};
}
