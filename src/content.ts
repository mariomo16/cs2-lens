import { fetchPlayerStats, type StatsResponse } from "./modules/csstats";
import { createShowcaseElement, insertElement } from "./modules/ui";

function extractSteamId64(): string | null {
	const scripts = document.querySelectorAll("script");
	for (const script of scripts) {
		const match = script.textContent?.match(
			/g_rgProfileData\s*=\s*\{[^}]*"steamid"\s*:\s*"(\d{17})"/,
		);
		if (match) return match[1];
	}
	return null;
}

async function init() {
	const steamId64 = extractSteamId64();
	if (!steamId64) return;

	const result: StatsResponse = await fetchPlayerStats(steamId64);
	if (!result.ok) return;

	const el = createShowcaseElement(result.data);
	insertElement(el);
}

init();
