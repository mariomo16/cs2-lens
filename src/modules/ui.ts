import type { StatsResponse } from "./csstats";
import { populateStatsBlock } from "./showcase";

type InsertMode = "prepend" | "append" | "after";

interface InsertionCandidate {
	selector: string;
	mode: InsertMode;
}

const INSERTION_CANDIDATES: InsertionCandidate[] = [
	{ selector: ".profile_leftcol", mode: "prepend" },
	{ selector: ".profile_rightcol", mode: "prepend" },
	{ selector: ".profile_header", mode: "after" },
	{ selector: ".responsive_page_template_content", mode: "prepend" },
];

export function findInsertionTarget(): {
	anchor: Element;
	mode: InsertMode;
} | null {
	for (const candidate of INSERTION_CANDIDATES) {
		const anchor = document.querySelector(candidate.selector);
		if (anchor) return { anchor, mode: candidate.mode };
	}
	return null;
}

export function insertElement(element: HTMLElement): boolean {
	const target = findInsertionTarget();
	if (!target) return false;

	const { anchor, mode } = target;
	switch (mode) {
		case "prepend":
			anchor.prepend(element);
			break;
		case "append":
			anchor.append(element);
			break;
		default:
			anchor.after(element);
			break;
	}
	return true;
}

function buildShowcaseShell(steamId64: string): {
	el: HTMLElement;
	bg: HTMLElement;
} {
	const el = document.createElement("div");
	el.className = "profile_customization csl-showcase-container";

	const header = document.createElement("div");
	header.className = "profile_customization_header csl-showcase-header";

	const titleSpan = document.createElement("span");
	titleSpan.textContent = "CS2 Lens";

	const faceitInfo = document.createElement("span");
	faceitInfo.className = "csl-faceit-header-info";
	faceitInfo.style.display = "none";

	header.append(titleSpan, faceitInfo);

	const logoLink = document.createElement("a");
	logoLink.href = `https://csstats.gg/player/${steamId64}`;
	logoLink.target = "_blank";
	logoLink.className = "csstats-logo-link";

	const csText = document.createElement("span");
	csText.textContent = "CS";
	csText.className = "logo-cs";

	const statsText = document.createElement("span");
	statsText.textContent = "STATS";
	statsText.className = "logo-stats";

	const ggText = document.createElement("span");
	ggText.textContent = ".GG";
	ggText.className = "logo-gg";

	logoLink.append(csText, statsText, ggText);

	const logosWrapper = document.createElement("div");
	logosWrapper.style.display = "inline-flex";
	logosWrapper.style.alignItems = "center";
	logosWrapper.append(logoLink);

	const separator = document.createElement("span");
	separator.textContent = "|";
	separator.style.cssText =
		"color: rgba(255,255,255,0.3); margin: 0 10px; font-size: 1rem;";
	logosWrapper.append(separator);

	const fsggLink = document.createElement("a");
	fsggLink.href = `https://faceitstats.gg/?player=${steamId64}`;
	fsggLink.target = "_blank";
	fsggLink.className = "csl-fsgg-logo";

	const fText = document.createElement("span");
	fText.textContent = "F";
	fText.className = "logo-f";

	const sggText = document.createElement("span");
	sggText.textContent = "S.gg";
	sggText.className = "logo-sgg";

	fsggLink.append(fText, sggText);
	logosWrapper.append(fsggLink);
	header.append(logosWrapper);

	const block = document.createElement("div");
	block.className = "profile_customization_block";

	const bg = document.createElement("div");
	bg.className = "showcase_content_bg csl-showcase-content-bg";

	block.append(bg);
	el.append(header, block);

	return { el, bg };
}

const ERROR_MESSAGES: Record<string, string> = {
	private: "This profile has been set to private",
	not_found: "No matches have been added for this player",
	fetch_failed:
		"Couldn't load stats from csstats.gg right now. Try refreshing the page.",
};

export function createShowcaseElement(
	result: StatsResponse,
	steamId64: string,
): HTMLElement {
	const { el, bg } = buildShowcaseShell(steamId64);

	if (result.ok) {
		populateStatsBlock(bg, result.data);
	} else {
		const msg = document.createElement("p");
		msg.className = "csl-stats-unavailable";
		msg.textContent =
			ERROR_MESSAGES[result.error] ?? "Stats are currently unavailable.";
		bg.append(msg);
	}

	return el;
}

export function insertSteamId(steamId64: string): void {
	const rightCol = document.querySelector(".profile_rightcol");
	if (!rightCol) return;

	const container = document.createElement("div");
	container.className = "csl-steamid-container";

	const labelSpan = document.createElement("span");
	labelSpan.className = "csl-steamid-label";
	labelSpan.textContent = "SteamID64";

	const valueSpan = document.createElement("span");
	valueSpan.className = "csl-steamid-value";
	valueSpan.textContent = steamId64;

	container.append(labelSpan, valueSpan);
	rightCol.prepend(container);
}
