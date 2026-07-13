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

export function buildShowcaseShell(): {
  el: HTMLElement;
  bg1: HTMLElement;
  bg2: HTMLElement;
  bg3: HTMLElement;
} {
  const el = document.createElement("div");
  el.className = "profile_customization csl-showcase-container";

  const header = document.createElement("div");
  header.className = "profile_customization_header csl-showcase-header";

  const titleSpan = document.createElement("span");
  titleSpan.textContent = "CS2 Vision";

  const faceitInfo = document.createElement("span");
  faceitInfo.className = "csl-faceit-header-info";
  faceitInfo.style.display = "none";

  header.append(titleSpan, faceitInfo);

  // Create 3 separate showcase_content_bg containers
  const block1 = document.createElement("div");
  block1.className = "profile_customization_block";
  const bg1 = document.createElement("div");
  bg1.className = "showcase_content_bg csl-showcase-content-bg";
  block1.append(bg1);

  const block2 = document.createElement("div");
  block2.className = "profile_customization_block";
  const bg2 = document.createElement("div");
  bg2.className = "showcase_content_bg csl-showcase-content-bg";
  block2.append(bg2);

  const block3 = document.createElement("div");
  block3.className = "profile_customization_block";
  const bg3 = document.createElement("div");
  bg3.className = "showcase_content_bg csl-showcase-content-bg";
  block3.append(bg3);

  el.append(header, block1, block2, block3);

  return { el, bg1, bg2, bg3 };
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
  const { el, bg1 } = buildShowcaseShell();

  if (result.ok) {
    populateStatsBlock(bg1, result.data, undefined, steamId64);
  } else {
    const msg = document.createElement("p");
    msg.className = "csl-stats-unavailable";
    msg.textContent =
      ERROR_MESSAGES[result.error] ?? "Stats are currently unavailable.";
    bg1.append(msg);
  }

  return el;
}

export function createLoadingSpinner(): HTMLElement {
  const container = document.createElement("p");
  container.className = "csl-stats-unavailable";

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("fill", "currentColor");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("class", "csl-loading-spinner");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Loading");

  const c1 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  c1.setAttribute("cx", "4");
  c1.setAttribute("cy", "12");
  c1.setAttribute("r", "0");
  c1.innerHTML = `<animate begin="0;spinner_z0Or.end" attributeName="r" calcMode="spline" dur="0.5s" keySplines=".36,.6,.31,1" values="0;3" fill="freeze"/><animate begin="spinner_OLMs.end" attributeName="cx" calcMode="spline" dur="0.5s" keySplines=".36,.6,.31,1" values="4;12" fill="freeze"/><animate begin="spinner_UHR2.end" attributeName="cx" calcMode="spline" dur="0.5s" keySplines=".36,.6,.31,1" values="12;20" fill="freeze"/><animate id="spinner_lo66" begin="spinner_Aguh.end" attributeName="r" calcMode="spline" dur="0.5s" keySplines=".36,.6,.31,1" values="3;0" fill="freeze"/><animate id="spinner_z0Or" begin="spinner_lo66.end" attributeName="cx" dur="0.001s" values="20;4" fill="freeze"/>`;
  svg.append(c1);

  const c2 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  c2.setAttribute("cx", "4");
  c2.setAttribute("cy", "12");
  c2.setAttribute("r", "3");
  c2.innerHTML = `<animate begin="0;spinner_z0Or.end" attributeName="cx" calcMode="spline" dur="0.5s" keySplines=".36,.6,.31,1" values="4;12" fill="freeze"/><animate begin="spinner_OLMs.end" attributeName="cx" calcMode="spline" dur="0.5s" keySplines=".36,.6,.31,1" values="12;20" fill="freeze"/><animate id="spinner_JsnR" begin="spinner_UHR2.end" attributeName="r" calcMode="spline" dur="0.5s" keySplines=".36,.6,.31,1" values="3;0" fill="freeze"/><animate id="spinner_Aguh" begin="spinner_JsnR.end" attributeName="cx" dur="0.001s" values="20;4" fill="freeze"/><animate begin="spinner_Aguh.end" attributeName="r" calcMode="spline" dur="0.5s" keySplines=".36,.6,.31,1" values="0;3" fill="freeze"/>`;
  svg.append(c2);

  const c3 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  c3.setAttribute("cx", "12");
  c3.setAttribute("cy", "12");
  c3.setAttribute("r", "3");
  c3.innerHTML = `<animate begin="0;spinner_z0Or.end" attributeName="cx" calcMode="spline" dur="0.5s" keySplines=".36,.6,.31,1" values="12;20" fill="freeze"/><animate id="spinner_hSjk" begin="spinner_OLMs.end" attributeName="r" calcMode="spline" dur="0.5s" keySplines=".36,.6,.31,1" values="3;0" fill="freeze"/><animate id="spinner_UHR2" begin="spinner_hSjk.end" attributeName="cx" dur="0.001s" values="20;4" fill="freeze"/><animate begin="spinner_UHR2.end" attributeName="r" calcMode="spline" dur="0.5s" keySplines=".36,.6,.31,1" values="0;3" fill="freeze"/><animate begin="spinner_Aguh.end" attributeName="cx" calcMode="spline" dur="0.5s" keySplines=".36,.6,.31,1" values="4;12" fill="freeze"/>`;
  svg.append(c3);

  const c4 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  c4.setAttribute("cx", "20");
  c4.setAttribute("cy", "12");
  c4.setAttribute("r", "3");
  c4.innerHTML = `<animate id="spinner_4v5M" begin="0;spinner_z0Or.end" attributeName="r" calcMode="spline" dur="0.5s" keySplines=".36,.6,.31,1" values="3;0" fill="freeze"/><animate id="spinner_OLMs" begin="spinner_4v5M.end" attributeName="cx" dur="0.001s" values="20;4" fill="freeze"/><animate begin="spinner_OLMs.end" attributeName="r" calcMode="spline" dur="0.5s" keySplines=".36,.6,.31,1" values="0;3" fill="freeze"/><animate begin="spinner_UHR2.end" attributeName="cx" calcMode="spline" dur="0.5s" keySplines=".36,.6,.31,1" values="4;12" fill="freeze"/><animate begin="spinner_Aguh.end" attributeName="cx" calcMode="spline" dur="0.5s" keySplines=".36,.6,.31,1" values="12;20" fill="freeze"/>`;
  svg.append(c4);

  const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
  title.textContent = "Cargando";
  svg.prepend(title);

  container.append(svg);
  return container;
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

  const copyBtn = document.createElement("button");
  copyBtn.className = "csl-steamid-copy";
  copyBtn.title = "Copy SteamID64";

  const copyImg = document.createElement("img");
  copyImg.src = chrome.runtime.getURL(
    "public/assets/ui/clipboard-document.svg",
  );
  copyImg.alt = "Copy";
  copyImg.className = "csl-steamid-copy-icon";
  copyBtn.append(copyImg);

  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(steamId64).catch(() => {});
    copyBtn.disabled = true;
    copyImg.src = chrome.runtime.getURL("public/assets/ui/check.svg");
    copyImg.alt = "Copied";
    copyBtn.classList.add("csl-steamid-copy--done");
    setTimeout(() => {
      copyBtn.disabled = false;
      copyImg.src = chrome.runtime.getURL(
        "public/assets/ui/clipboard-document.svg",
      );
      copyImg.alt = "Copy";
      copyBtn.classList.remove("csl-steamid-copy--done");
    }, 1500);
  });

  container.append(labelSpan, valueSpan, copyBtn);
  rightCol.prepend(container);
}
