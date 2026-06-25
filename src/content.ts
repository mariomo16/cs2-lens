import {
	fetchFaceitStats,
	fetchPlayerStats,
	type StatsResponse,
} from "./modules/csstats";
import { appendFaceitBlock, appendFaceitPlaceholder } from "./modules/showcase";
import {
	createShowcaseElement,
	insertElement,
	insertSteamId,
} from "./modules/ui";

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
	const pathRegex = /^\/(id|profiles)\/[^/]+\/?$/i;
	if (!pathRegex.test(window.location.pathname)) {
		return;
	}

	const steamId64 = extractSteamId64();
	if (!steamId64) return;

	const result: StatsResponse = await fetchPlayerStats(steamId64);
	const el = createShowcaseElement(result, steamId64);

	insertSteamId(steamId64);
	insertElement(el);

	if (result.ok) {
		const bg = el.querySelector(
			".csl-showcase-content-bg",
		) as HTMLElement | null;
		if (bg) appendFaceitPlaceholder(bg);
	}

	fetchFaceitStats(steamId64).then((faceit) => {
		if (!faceit) return;
		const bg = el.querySelector(
			".csl-showcase-content-bg",
		) as HTMLElement | null;
		if (bg) appendFaceitBlock(bg, faceit);
	});
}

void init();
