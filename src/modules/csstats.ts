const CSSTATS_BASE_URL = "https://csstats.gg/player";
const FACITSTATS_API = "https://faceitstats.gg/api/player/details";

export interface PremierRating {
	season: number;
	latestRating: number | null;
	bestRating: number | null;
	wins: number;
}

export interface FaceitStats {
	level: number | null;
	elo: number | null;
}

export interface PlayerStats {
	premierRatings: PremierRating[];
	faceit: FaceitStats | null;
	kdRatio: number | null;
	hltvRating: number | null;
	matches: number | null;
	winRate: number | null;
	headshotPercentage: number | null;
	adr: number | null;
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
	const json = await sendFetchMessage(`${FACITSTATS_API}/${steamId64}`);
	if (!json) return null;

	try {
		const data = JSON.parse(json);
		const level = data?.profile?.cs2_level ?? null;
		const elo = data?.profile?.cs2_elo ?? null;
		if (level !== null || elo !== null) return { level, elo };
	} catch {}

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
	let headshotPercentage: number | null = null;
	let adr: number | null = null;

	const parsePanelValue = (panel: Element): number | null => {
		const text = panel
			.querySelector("[style*='font-size:34px']")
			?.childNodes[0]?.textContent?.trim();
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
		} else if (heading.includes("HS") && headshotPercentage === null) {
			headshotPercentage = parsePanelValue(panel);
		} else if (heading.includes("ADR")) {
			adr = parsePanelValue(panel);
		}
	});

	const parsePremierRating = (container: Element | null): number | null => {
		if (!container) return null;
		const span = container.querySelector(".cs2rating span");
		if (!span) return null;
		const main = span.childNodes[0]?.textContent?.trim() ?? "";
		if (main === "---") return 0;
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
			headshotPercentage,
			adr,
			trackingDisabled,
			trackingInactive,
		},
	};
}
