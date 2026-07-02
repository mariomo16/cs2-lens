import { fetchPlayerStats, type StatsResponse } from "../modules/csstats";
import { fetchFaceitStats } from "../modules/faceit";
import {
  appendFaceitBlock,
  appendFaceitPlaceholder,
  populateStatsBlock,
  updateFaceitHeader,
} from "../modules/showcase";
import {
  buildShowcaseShell,
  createLoadingSpinner,
  insertElement,
  insertSteamId,
} from "../modules/ui";

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

  insertSteamId(steamId64);

  const { el, bg } = buildShowcaseShell(steamId64);
  bg.append(createLoadingSpinner());
  insertElement(el);

  const result: StatsResponse = await fetchPlayerStats(steamId64);

  bg.innerHTML = "";

  if (result.ok) {
    populateStatsBlock(bg, result.data);
    appendFaceitPlaceholder(bg);
  } else {
    const msg = document.createElement("p");
    msg.className = "csl-stats-unavailable";
    msg.textContent =
      result.error === "private"
        ? "This profile has been set to private"
        : result.error === "not_found"
          ? "No matches have been added for this player"
          : "Couldn't load stats from csstats.gg right now. Try refreshing the page.";
    bg.append(msg);
  }

  fetchFaceitStats(steamId64).then((faceit) => {
    if (!faceit) return;
    appendFaceitBlock(bg, faceit);
    updateFaceitHeader(el, faceit);
  });
}

void init();
