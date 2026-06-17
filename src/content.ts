import { type CSStatsResponse, fetchCSStats } from "./modules/csstats";
import { createShowcaseElement, insertElement } from "./modules/ui";

function getSteamId64(): string | null {
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
	const steamId64 = getSteamId64();
	if (!steamId64) return;

	const result: CSStatsResponse = await fetchCSStats(steamId64);
	if (!result.ok) return;

	const el = createShowcaseElement(result.data);
	insertElement(el);
}

init();
