import type { PlayerStats } from "./csstats";
import type { FaceitStats } from "./faceit";
import type { LeetifyStats } from "./leetify";

interface PremierTier {
  color: string;
  file: string;
}

const getPremierTier = (rating: number | null): PremierTier => {
  if (!rating) return { color: "#ded6cc", file: "grey.svg" };
  if (rating < 5000) return { color: "#b0c3d9", file: "lightblue.svg" };
  if (rating < 10000) return { color: "#5e98d9", file: "lightblue.svg" };
  if (rating < 15000) return { color: "#4b69ff", file: "blue.svg" };
  if (rating < 20000) return { color: "#8847ff", file: "purple.svg" };
  if (rating < 25000) return { color: "#d32ce6", file: "pink.svg" };
  if (rating < 30000) return { color: "#eb4b4b", file: "red.svg" };
  return { color: "#f4ed16", file: "gold.svg" };
};

const resolveFaceitSvgFile = (
  level: number,
  regionalRank: number | null,
): string => {
  if (regionalRank === 1) return "challenger1.svg";
  if (regionalRank === 2) return "challenger2.svg";
  if (regionalRank === 3) return "challenger3.svg";
  if (regionalRank != null && regionalRank > 3 && regionalRank <= 1000)
    return "challenger.svg";
  return `${Math.max(1, level)}.svg`;
};

const createTrackingNotice = (
  type: "disabled" | "inactive",
): HTMLParagraphElement => {
  const notice = document.createElement("p");
  notice.className =
    type === "disabled"
      ? "csl-tracking-notice"
      : "csl-tracking-notice csl-tracking-notice--inactive";
  notice.textContent =
    type === "disabled"
      ? "This player has not set up match tracking. Stats may be incomplete."
      : "A Valve match from the past 30 days is required to reactivate. Stats may be incomplete.";
  return notice;
};

function createRatingDisplay(data: {
  title: string;
  rating: number | null;
}): HTMLDivElement {
  const statBlock = document.createElement("div");
  statBlock.className = "csl-premier-stat-block";

  const tier = getPremierTier(data.rating);

  const ratingWrapper = document.createElement("div");
  ratingWrapper.className = "csl-rating-wrapper";

  const svgBg = document.createElement("div");
  svgBg.className = "csl-svg-bg";
  svgBg.style.backgroundImage = `url("${chrome.runtime.getURL(`public/assets/premier/${tier.file}`)}")`;

  const ratingVal = document.createElement("div");
  ratingVal.className = "cs2-vision-premier-rating csl-premier-rating";
  ratingVal.style.color = tier.color;

  if (data.rating) {
    const ratingStr = data.rating.toLocaleString("en-US");
    if (data.rating >= 1000) {
      const last3 = ratingStr.slice(-4);
      const prefix = ratingStr.slice(0, -4);
      ratingVal.innerHTML = `${prefix}<span class="csl-premier-rating-small">${last3}</span>`;
    } else {
      ratingVal.textContent = ratingStr;
    }
  } else {
    ratingVal.textContent = "---";
  }

  ratingWrapper.append(svgBg, ratingVal);

  const lblEl = document.createElement("div");
  lblEl.className = "csl-stat-label";
  lblEl.textContent = data.title;

  statBlock.append(ratingWrapper, lblEl);
  return statBlock;
}

function createStatValue(value: string, label: string): HTMLDivElement {
  const block = document.createElement("div");
  block.className = "csl-grid-stat";

  const valEl = document.createElement("div");
  valEl.className = "csl-grid-stat-value";
  valEl.textContent = value;

  const lblEl = document.createElement("div");
  lblEl.className = "csl-stat-label";
  lblEl.textContent = label;

  block.append(valEl, lblEl);
  return block;
}

function createSectionHeader(title: string): HTMLDivElement {
  const header = document.createElement("div");
  header.className = "csl-container-header";
  const titleSpan = document.createElement("span");
  titleSpan.textContent = title;
  header.append(titleSpan);
  return header;
}

function createStatsGrid(): HTMLDivElement {
  const grid = document.createElement("div");
  grid.className = "csl-container-stats-grid";
  return grid;
}

export function populateStatsBlock(
  block: HTMLElement,
  csstats: PlayerStats,
): void {
  const header = createSectionHeader("CSSTATS");
  const nameEl = document.createElement("span");
  nameEl.textContent = "Player";
  header.prepend(nameEl);
  const grid = createStatsGrid();

  const premierRow = document.createElement("div");
  premierRow.className = "csl-premier-row";

  if (csstats.premierRatings.length > 0) {
    const sortedBySeason = [...csstats.premierRatings].sort(
      (a, b) => b.season - a.season,
    );
    const currentPremier = sortedBySeason[0];
    const bestPremier = csstats.premierRatings.reduce((max, current) => {
      const maxVal = max.bestRating ?? 0;
      const currentVal = current.bestRating ?? 0;
      return currentVal > maxVal ? current : max;
    }, csstats.premierRatings[0]);

    premierRow.append(
      createRatingDisplay({
        title: "Current",
        rating: currentPremier.latestRating,
      }),
    );
    premierRow.append(
      createRatingDisplay({ title: "Best", rating: bestPremier.bestRating }),
    );
  } else {
    premierRow.append(
      createRatingDisplay({ title: "Unranked", rating: null }),
    );
  }

  grid.append(premierRow);

  const stats = [
    { label: "K/D", value: csstats.kdRatio?.toFixed(2) ?? "-" },
    { label: "HLTV", value: csstats.hltvRating?.toFixed(2) ?? "-" },
    {
      label: "HS%",
      value: csstats.hsPercent != null ? `${Math.round(csstats.hsPercent)}%` : "-",
    },
    { label: "Matches", value: csstats.matches?.toLocaleString() ?? "-" },
    {
      label: "Win Rate",
      value: csstats.winRate != null ? `${csstats.winRate.toFixed(0)}%` : "-",
    },
  ];

  stats.forEach((s) => {
    grid.append(createStatValue(s.value, s.label));
  });

  block.append(header, grid);

  if (csstats.trackingDisabled) {
    block.append(createTrackingNotice("disabled"));
  } else if (csstats.trackingInactive) {
    block.append(createTrackingNotice("inactive"));
  }
}

export function appendFaceitBlock(
  block: HTMLElement,
  faceit: FaceitStats,
): void {
  const header = createSectionHeader("FACEIT");
  if (faceit.nickname) {
    const link = document.createElement("a");
    link.href = `https://www.faceit.com/en/players/${encodeURIComponent(faceit.nickname)}`;
    link.target = "_blank";
    link.style.display = "inline-flex";
    link.style.alignItems = "center";
    link.style.gap = "4px";
    link.style.color = "inherit";
    link.style.textDecoration = "none";

    if (faceit.country) {
      const flag = document.createElement("img");
      flag.className = "csl-faceit-flag";
      flag.src = `https://flagcdn.com/16x12/${faceit.country.toLowerCase()}.png`;
      flag.alt = faceit.country;
      link.append(flag);
    }

    const nameSpan = document.createElement("span");
    nameSpan.textContent = faceit.nickname;
    link.append(nameSpan);

    if (faceit.verified) {
      const verifiedImg = document.createElement("img");
      verifiedImg.className = "csl-faceit-verified";
      verifiedImg.src = chrome.runtime.getURL("public/assets/faceit/verified.svg");
      verifiedImg.alt = "Verified";
      link.append(verifiedImg);
    }

    header.prepend(link);
  }
  const grid = createStatsGrid();

  const level = faceit.level ?? 0;
  const svgFile =
    level > 0
      ? resolveFaceitSvgFile(level, faceit.regional_rank ?? null)
      : "unranked.svg";

  const badgeBlock = document.createElement("div");
  badgeBlock.className = "csl-grid-stat";

  if (
    faceit.regional_rank != null &&
    faceit.regional_rank >= 1 &&
    faceit.regional_rank <= 1000
  ) {
    const rankEl = document.createElement("div");
    rankEl.className = "csl-faceit-rank";

    let bgColor = "#E80128";
    if (faceit.regional_rank === 1) bgColor = "#FFD336";
    else if (faceit.regional_rank === 2) bgColor = "#DEF5FF";
    else if (faceit.regional_rank === 3) bgColor = "#FF7236";
    rankEl.style.backgroundColor = bgColor;
    rankEl.style.color = "#000";

    const numSpan = document.createElement("span");
    numSpan.textContent = `#${faceit.regional_rank}`;
    rankEl.append(numSpan);

    const rankSvg = document.createElement("img");
    rankSvg.className = "csl-faceit-rank-svg";
    rankSvg.src = chrome.runtime.getURL(`public/assets/faceit/${svgFile}`);
    rankSvg.alt = `Challenger ${faceit.regional_rank}`;
    rankEl.append(rankSvg);

    badgeBlock.append(rankEl);
  } else {
    const ratingWrapper = document.createElement("div");
    ratingWrapper.className = "csl-rating-wrapper";

    const svgBg = document.createElement("div");
    svgBg.className = "csl-svg-bg";
    svgBg.style.backgroundImage = `url("${chrome.runtime.getURL(`public/assets/faceit/${svgFile}`)}")`;

    ratingWrapper.append(svgBg);
    badgeBlock.append(ratingWrapper);
  }

  if (faceit.elo != null) {
    const lblEl = document.createElement("div");
    lblEl.className = "csl-stat-label";
    lblEl.textContent = `${faceit.elo.toLocaleString()} ELO`;
    badgeBlock.append(lblEl);
  }

  grid.append(badgeBlock);

  const faceitStats = [
    { label: "HS%", value: "52%" },
    { label: "K/D", value: "1.12" },
    { label: "Win Rate", value: "54%" },
    { label: "Matches", value: "345" },
    { label: "ADR", value: "86.3" },
  ];

  faceitStats.forEach((s) => {
    grid.append(createStatValue(s.value, s.label));
  });

  const faceitBody = document.createElement("div");
  faceitBody.className = "csl-faceit-body";

  const last5Container = document.createElement("div");
  last5Container.className = "csl-last5-container";

  const last5Title = document.createElement("div");
  last5Title.className = "csl-stat-label";
  last5Title.textContent = "LAST 5";
  last5Container.append(last5Title);

  const last5 = ["W", "L", "W", "L", "W"];
  last5.forEach((res) => {
    const item = document.createElement("span");
    item.className = `csl-last5-item csl-last5-item-${res.toLowerCase()}`;
    item.textContent = res;
    last5Container.append(item);
  });

  faceitBody.append(grid, last5Container);
  block.append(header, faceitBody);
}

export function appendLeetifyBlock(
  block: HTMLElement,
  stats: LeetifyStats,
): void {
  const header = createSectionHeader("LEETIFY");
  const grid = createStatsGrid();

  if (stats.name) {
    const nameEl = document.createElement("span");
    nameEl.textContent = stats.name;
    header.prepend(nameEl);
  }

  const statsList = [
    {
      label: "Aim",
      value: stats.aim != null ? Math.round(stats.aim).toString() : "-",
    },
    {
      label: "Utility",
      value: stats.utility != null ? Math.round(stats.utility).toString() : "-",
    },
    {
      label: "Positioning",
      value:
        stats.positioning != null
          ? Math.round(stats.positioning).toString()
          : "-",
    },
    {
      label: "Clutch",
      value: stats.clutch != null ? (stats.clutch * 100).toFixed(2) : "-",
    },
    {
      label: "Opening",
      value: stats.opening != null ? (stats.opening * 100).toFixed(2) : "-",
    },
    {
      label: "Rating",
      value: stats.leetifyRating != null ? stats.leetifyRating.toFixed(2) : "-",
    },
  ];

  statsList.forEach((s) => {
    grid.append(createStatValue(s.value, s.label));
  });

  block.append(header, grid);
}

export function updateFaceitHeader(
  container: HTMLElement,
  faceit: FaceitStats,
): void {
  const infoEl = container.querySelector(
    ".csl-faceit-header-info",
  ) as HTMLElement | null;
  if (!infoEl || !faceit.nickname) return;

  const link = document.createElement("a");
  link.href = `https://www.faceit.com/en/players/${encodeURIComponent(faceit.nickname)}`;
  link.target = "_blank";
  link.className = "csl-faceit-player-link";

  if (faceit.country) {
    const flag = document.createElement("img");
    flag.className = "csl-faceit-flag";
    flag.src = `https://flagcdn.com/16x12/${faceit.country.toLowerCase()}.png`;
    flag.alt = faceit.country;
    link.append(flag);
  }

  const nameSpan = document.createElement("span");
  nameSpan.textContent = faceit.nickname;
  link.append(nameSpan);

  if (faceit.verified) {
    const verifiedImg = document.createElement("img");
    verifiedImg.className = "csl-faceit-verified";
    verifiedImg.src = chrome.runtime.getURL(
      "public/assets/faceit/verified.svg",
    );
    verifiedImg.alt = "Verified";
    link.append(verifiedImg);
  }

  infoEl.append(link);
  infoEl.style.display = "";
}

export function appendFaceitPlaceholder(block: HTMLElement): void {
  const header = createSectionHeader("FACEIT");
  header.classList.add("csl-faceit-placeholder-header");
  const grid = createStatsGrid();
  grid.classList.add("csl-faceit-placeholder");
  const row = document.createElement("div");
  row.className = "csl-loading-row";
  row.textContent = "Loading...";
  grid.append(row);
  block.append(header, grid);
}
