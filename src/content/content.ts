import { fetchPlayerStats, type StatsResponse } from "../services/csstats";
import { fetchFaceitStats } from "../services/faceit";
import { fetchLeetifyStats } from "../services/leetify";
import {
  buildShowcaseShell,
  createLoadingSpinner,
  insertElement,
  insertSteamId,
} from "../ui/dom";
import {
  appendFaceitBlock,
  appendLeetifyBlock,
  populateStatsBlock,
} from "../ui/stats-renderer";

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

  const { container, statsPanel, faceitPanel, leetifyPanel } =
    buildShowcaseShell();
  statsPanel.append(createLoadingSpinner());
  faceitPanel.append(createLoadingSpinner());
  leetifyPanel.append(createLoadingSpinner());
  insertElement(container);

  const personaName =
    document.querySelector(".actual_persona_name")?.textContent?.trim() ??
    "Player";

  const result: StatsResponse = await fetchPlayerStats(steamId64);

  statsPanel.innerHTML = "";

  if (result.ok) {
    populateStatsBlock(statsPanel, result.data, personaName, steamId64);
  } else {
    const msg = document.createElement("p");
    msg.className = "csl-stats-unavailable";
    msg.textContent =
      result.error === "private"
        ? "This profile has been set to private"
        : result.error === "not_found"
          ? "No matches have been added for this player"
          : "Couldn't load stats from csstats.gg right now. Try refreshing the page.";
    statsPanel.append(msg);
  }

  await Promise.all([
    fetchFaceitStats(steamId64).then((faceit) => {
      faceitPanel.innerHTML = "";
      if (!faceit) {
        const msg = document.createElement("p");
        msg.className = "csl-stats-unavailable";
        msg.textContent = "This player has no Faceit account linked";
        faceitPanel.append(msg);
        return;
      }
      appendFaceitBlock(faceitPanel, faceit);
    }),
    fetchLeetifyStats(steamId64).then((leetify) => {
      leetifyPanel.innerHTML = "";
      if (!leetify) {
        const msg = document.createElement("p");
        msg.className = "csl-stats-unavailable";
        msg.textContent = "This player has no Leetify profile linked";
        leetifyPanel.append(msg);
        return;
      }
      appendLeetifyBlock(leetifyPanel, leetify);
    }),
  ]);
}

void init();
