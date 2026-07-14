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
): HTMLDivElement => {
  const notice = document.createElement("div");
  notice.className = `csl-tracking-notice csl-tracking-notice--${type}`;

  const icon = document.createElement("span");
  icon.className = "csl-tracking-icon";
  const svgUrl = chrome.runtime.getURL(
    "public/assets/ui/exclamation-triangle.svg",
  );
  icon.style.maskImage = `url("${svgUrl}")`;
  icon.style.webkitMaskImage = `url("${svgUrl}")`;

  const text = document.createElement("span");
  text.textContent =
    type === "disabled"
      ? "This player has not set up match tracking. Stats may be incomplete."
      : "A Valve match from the past 30 days is required to reactivate. Stats may be incomplete.";

  notice.append(icon, text);
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
  playerName?: string,
  steamId64?: string,
): void {
  const header = document.createElement("div");
  header.className = "csl-container-header";
  const nameEl = document.createElement("a");
  nameEl.href = `https://csstats.gg/player/${steamId64 ?? ""}`;
  nameEl.target = "_blank";
  nameEl.textContent = playerName ?? "Player";
  nameEl.className = "csl-csstats-player-link";

  const logoLink = document.createElement("a");
  logoLink.href = `https://csstats.gg/`;
  logoLink.target = "_blank";
  logoLink.className = "csstats-logo-link";
  logoLink.style.fontSize = "14px";
  logoLink.style.letterSpacing = "normal";
  logoLink.style.textTransform = "none";
  logoLink.style.display = "inline-block";
  logoLink.style.lineHeight = "1";

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

  header.append(nameEl, logoLink);
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
    premierRow.append(createRatingDisplay({ title: "Unranked", rating: null }));
  }

  grid.style.gridTemplateColumns = "repeat(4, 1fr)";

  premierRow.style.marginBottom = "0";
  premierRow.style.gridColumn = "1 / 3";
  grid.append(premierRow);

  const kdEl = createStatValue(csstats.kdRatio?.toFixed(2) ?? "-", "K/D");
  kdEl.style.gridColumn = "3";
  kdEl.style.gridRow = "1";
  grid.append(kdEl);

  const hltvEl = createStatValue(csstats.hltvRating?.toFixed(2) ?? "-", "HLTV");
  hltvEl.style.gridColumn = "4";
  hltvEl.style.gridRow = "1";
  grid.append(hltvEl);

  const matchesEl = createStatValue(
    csstats.matches?.toLocaleString() ?? "-",
    "Matches",
  );
  matchesEl.style.gridColumn = "1";
  matchesEl.style.gridRow = "2";
  grid.append(matchesEl);

  const winRateEl = createStatValue(
    csstats.winRate != null ? `${csstats.winRate.toFixed(0)}%` : "-",
    "Win Rate",
  );
  winRateEl.style.gridColumn = "2";
  winRateEl.style.gridRow = "2";
  grid.append(winRateEl);

  const adrEl = createStatValue(
    csstats.adr != null ? Math.round(csstats.adr).toString() : "-",
    "ADR",
  );
  adrEl.style.gridColumn = "3";
  adrEl.style.gridRow = "2";
  grid.append(adrEl);

  const hsEl = createStatValue(
    csstats.hsPercent != null ? `${Math.round(csstats.hsPercent)}%` : "-",
    "HS%",
  );
  hsEl.style.gridColumn = "4";
  hsEl.style.gridRow = "2";
  grid.append(hsEl);

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
  const header = document.createElement("div");
  header.className = "csl-container-header";

  if (faceit.nickname) {
    const link = document.createElement("a");
    link.href = `https://www.faceit.com/en/players/${encodeURIComponent(faceit.nickname)}`;
    link.target = "_blank";
    link.className = "csl-faceit-header-link";

    if (faceit.country) {
      const flag = document.createElement("img");
      flag.className = "csl-faceit-flag";
      flag.src = `https://flagcdn.com/16x12/${faceit.country.toLowerCase()}.png`;
      flag.alt = faceit.country;
      link.append(flag);
    }

    const nameSpan = document.createElement("span");
    nameSpan.className = "csl-faceit-header-name";
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

    header.append(link);
  }

  const faceitLogoLink = document.createElement("a");
  faceitLogoLink.href = `https://www.faceit.com/`;
  faceitLogoLink.target = "_blank";
  faceitLogoLink.className = "csl-fsgg-logo";

  const faceitLogo = document.createElement("img");
  faceitLogo.src = chrome.runtime.getURL("public/assets/faceit/faceit.svg");
  faceitLogo.className = "csl-faceit-logo";
  faceitLogo.alt = "Faceit";
  faceitLogo.style.height = "11px";
  faceitLogo.style.background = "none";

  faceitLogoLink.append(faceitLogo);
  header.append(faceitLogoLink);
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
    ratingWrapper.className = "csl-faceit-level-wrapper";

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
    {
      label: "HS%",
      value:
        faceit.hsPercent != null ? `${Math.round(faceit.hsPercent)}%` : "-",
    },
    {
      label: "K/D",
      value: faceit.kdRatio != null ? Number(faceit.kdRatio).toFixed(2) : "-",
    },
    {
      label: "Win Rate",
      value:
        faceit.winRate != null ? `${Number(faceit.winRate).toFixed(0)}%` : "-",
    },
    { label: "Matches", value: faceit.matches?.toLocaleString() ?? "-" },
    {
      label: "ADR",
      value: faceit.adr != null ? Math.round(faceit.adr).toString() : "-",
    },
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

  const last5 =
    faceit.last5.length > 0 ? faceit.last5 : ["W", "L", "W", "L", "W"];
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
  const grid = createStatsGrid();

  const signedStats: {
    label: string;
    num: number | null;
    fmt: (v: number) => string;
  }[] = [
    { label: "Clutch", num: stats.clutch, fmt: (v) => (v * 100).toFixed(2) },
    { label: "Opening", num: stats.opening, fmt: (v) => (v * 100).toFixed(2) },
    {
      label: "Leetify Rating",
      num: stats.leetifyRating,
      fmt: (v) => v.toFixed(2),
    },
  ];
  const plainStats: { label: string; value: string }[] = [
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
  ];

  plainStats.forEach((s) => grid.append(createStatValue(s.value, s.label)));

  signedStats.forEach((s) => {
    if (s.num == null) {
      grid.append(createStatValue("-", s.label));
      return;
    }
    const block = document.createElement("div");
    block.className = "csl-grid-stat";

    const valEl = document.createElement("div");
    valEl.className = "csl-grid-stat-value";
    if (s.num >= 0) valEl.dataset.sign = "+";
    valEl.textContent = s.fmt(s.num);

    const lblEl = document.createElement("div");
    lblEl.className = "csl-stat-label";
    lblEl.textContent = s.label;

    block.append(valEl, lblEl);
    grid.append(block);
  });

  const leetifyLogoLink = document.createElement("a");
  leetifyLogoLink.href = "https://leetify.com/";
  leetifyLogoLink.target = "_blank";
  leetifyLogoLink.style.display = "flex";
  leetifyLogoLink.style.alignItems = "center";

  const leetifyLogo = document.createElement("img");
  leetifyLogo.src = chrome.runtime.getURL(
    "public/assets/leetify/Leetify Badge White Small.png",
  );
  leetifyLogo.alt = "Leetify";
  leetifyLogo.style.height = "42px";
  leetifyLogo.style.display = "block";

  leetifyLogoLink.append(leetifyLogo);

  grid.style.flex = "1";

  const body = document.createElement("div");
  body.style.display = "flex";
  body.style.alignItems = "center";
  body.style.gap = "12px";
  body.append(grid, leetifyLogoLink);
  block.append(body);
}

export function updateFaceitHeader(
  _container: HTMLElement,
  _faceit: FaceitStats,
): void {}

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
