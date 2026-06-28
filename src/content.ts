import {
	fetchFaceitStats,
	fetchPlayerStats,
	type StatsResponse,
} from "./modules/csstats";
import { fetchInventoryValue, type InventoryValue } from "./modules/inventory";
import {
	appendFaceitBlock,
	appendFaceitPlaceholder,
	updateFaceitHeader,
} from "./modules/showcase";
import {
	createShowcaseElement,
	insertElement,
	insertInventoryValue,
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

	const [result, invValue]: [StatsResponse, InventoryValue] = await Promise.all(
		[
			fetchPlayerStats(steamId64),
			fetchInventoryValue(steamId64, (csfloatText) => {
				const el = document.querySelector(".csl-inv-csfloat");
				if (el) el.textContent = csfloatText;
			}),
		],
	);

	const el = createShowcaseElement(result, steamId64);
	const bg = el.querySelector(".csl-showcase-content-bg") as HTMLElement;

	insertSteamId(steamId64);
	insertInventoryValue(invValue);
	insertElement(el);

	if (result.ok) {
		appendFaceitPlaceholder(bg);
	}

	fetchFaceitStats(steamId64).then((faceit) => {
		if (!faceit) return;
		appendFaceitBlock(bg, faceit);
		updateFaceitHeader(el, faceit);
	});
}

void init();
