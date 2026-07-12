import { fetchPlayerStats, type StatsResponse } from "../modules/csstats";
import { fetchFaceitStats } from "../modules/faceit";
import { fetchLeetifyStats } from "../modules/leetify";
import {
  appendFaceitBlock,
  appendFaceitPlaceholder,
  appendLeetifyBlock,
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

  const { el, bg1, bg2, bg3 } = buildShowcaseShell(steamId64);
  bg1.append(createLoadingSpinner());
  insertElement(el);

  const result: StatsResponse = await fetchPlayerStats(steamId64);

  bg1.innerHTML = "";

  if (result.ok) {
    populateStatsBlock(bg1, result.data);
    appendFaceitPlaceholder(bg2);
  } else {
    const msg = document.createElement("p");
    msg.className = "csl-stats-unavailable";
    msg.textContent =
      result.error === "private"
        ? "This profile has been set to private"
        : result.error === "not_found"
          ? "No matches have been added for this player"
          : "Couldn't load stats from csstats.gg right now. Try refreshing the page.";
    bg1.append(msg);
  }

  await Promise.all([
    fetchFaceitStats(steamId64).then((faceit) => {
      if (!faceit) return;
      const placeholderGrid = bg2.querySelector(".csl-faceit-placeholder");
      const placeholderHeader = bg2.querySelector(
        ".csl-faceit-placeholder-header",
      );
      if (placeholderGrid) placeholderGrid.remove();
      if (placeholderHeader) placeholderHeader.remove();
      appendFaceitBlock(bg2, faceit);
      updateFaceitHeader(el, faceit);
    }),
    fetchLeetifyStats(steamId64).then((leetify) => {
      if (!leetify) return;
      appendLeetifyBlock(bg3, leetify);
    }),
  ]);
}

void init();
