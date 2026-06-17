import type { CSStatsResult } from "./csstats";

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

export function createShowcaseElement(stats: CSStatsResult): HTMLElement {
	const el = document.createElement("div");
	el.className = "profile_customization";
	el.style.marginBottom = "12px";

	const header = document.createElement("div");
	header.className = "profile_customization_header";
	header.append("CS2 Lens");

	const block = document.createElement("div");
	block.className = "profile_customization_block";

	populateStatsBlock(block, stats);

	el.append(header, block);

	return el;
}

function populateStatsBlock(block: HTMLElement, stats: CSStatsResult): void {
	block.style.display = "flex";
	block.style.flexDirection = "column";
	block.style.gap = "16px";

	const getPremierTier = (rating: number | null) => {
		if (!rating) return { color: "#7a8289", file: "grey.svg" };
		if (rating < 5000) return { color: "#b0c3d9", file: "grey.svg" };
		if (rating < 10000) return { color: "#5e98d9", file: "lightblue.svg" };
		if (rating < 15000) return { color: "#4b69ff", file: "blue.svg" };
		if (rating < 20000) return { color: "#8847ff", file: "purple.svg" };
		if (rating < 25000) return { color: "#d32ce6", file: "pink.svg" };
		if (rating < 30000) return { color: "#eb4b4b", file: "red.svg" };
		return { color: "#e4a51c", file: "gold.svg" };
	};

	if (stats.premier_ratings && stats.premier_ratings.length > 0) {
		const premierContainer = document.createElement("div");
		premierContainer.style.display = "flex";
		premierContainer.style.gap = "12px";
		premierContainer.style.flexWrap = "wrap";

		const sortedBySeason = [...stats.premier_ratings].sort(
			(a, b) => b.season - a.season,
		);
		const currentPremier = sortedBySeason[0];

		const bestPremier = stats.premier_ratings.reduce((max, current) => {
			const maxVal = max.best_rating ?? 0;
			const currentVal = current.best_rating ?? 0;
			return currentVal > maxVal ? current : max;
		}, stats.premier_ratings[0]);

		const displayRatings = [
			{ title: "Current Rating", rating: currentPremier.latest_rating },
			{ title: "Best Rating", rating: bestPremier.best_rating },
		];

		displayRatings.forEach((data) => {
			const card = document.createElement("div");
			card.style.flex = "1";
			card.style.minWidth = "140px";
			card.style.height = "95px";
			card.style.backgroundColor = "rgba(0, 0, 0, 0.2)";
			card.style.border = "1px solid rgba(255, 255, 255, 0.05)";
			card.style.borderRadius = "4px";
			card.style.display = "flex";
			card.style.flexDirection = "column";
			card.style.justifyContent = "center";
			card.style.alignItems = "center";
			card.style.fontFamily = '"Motiva Sans", Sans-Serif';

			const tier = getPremierTier(data.rating);

			const titleLabel = document.createElement("div");
			titleLabel.style.fontSize = "11px";
			titleLabel.style.color = "#8b929a";
			titleLabel.style.textTransform = "uppercase";
			titleLabel.style.letterSpacing = "0.5px";
			titleLabel.style.marginBottom = "6px";
			titleLabel.textContent = data.title;

			const ratingWrapper = document.createElement("div");
			ratingWrapper.style.position = "relative";
			ratingWrapper.style.width = "100px";
			ratingWrapper.style.height = "45px";
			ratingWrapper.style.display = "flex";
			ratingWrapper.style.justifyContent = "center";
			ratingWrapper.style.alignItems = "center";

			const svgBg = document.createElement("div");
			svgBg.style.position = "absolute";
			svgBg.style.top = "0";
			svgBg.style.left = "0";
			svgBg.style.width = "100%";
			svgBg.style.height = "100%";
			svgBg.style.backgroundImage = `url("${chrome.runtime.getURL(`assets/premier/${tier.file}`)}")`;
			svgBg.style.backgroundSize = "contain";
			svgBg.style.backgroundPosition = "center";
			svgBg.style.backgroundRepeat = "no-repeat";
			svgBg.style.zIndex = "1";

			const ratingVal = document.createElement("div");
			ratingVal.style.position = "relative";
			ratingVal.style.zIndex = "2";
			ratingVal.style.fontSize = "22px";
			ratingVal.style.fontWeight = "bold";
			ratingVal.style.color = tier.color;
			ratingVal.textContent = data.rating
				? data.rating.toLocaleString()
				: "N/A";

			ratingVal.style.paddingLeft = "12px";

			ratingWrapper.append(svgBg, ratingVal);

			card.append(titleLabel, ratingWrapper);
			premierContainer.append(card);
		});

		block.append(premierContainer);

		const divider = document.createElement("div");
		divider.style.height = "1px";
		divider.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
		block.append(divider);
	}

	const generalStatsContainer = document.createElement("div");
	generalStatsContainer.style.display = "flex";
	generalStatsContainer.style.justifyContent = "space-around";
	generalStatsContainer.style.textAlign = "center";

	const generalStats = [
		{ label: "K/D Ratio", value: stats.kd_ratio?.toFixed(2) ?? "0.00" },
		{ label: "HLTV Rating", value: stats.hltv_rating?.toFixed(2) ?? "0.00" },
		{ label: "Matches", value: stats.matches ?? 0 },
		{
			label: "Win Rate",
			value: stats.win_rate ? `${stats.win_rate.toFixed(1)}%` : "0.0%",
		},
	];

	generalStats.forEach((stat) => {
		const statBlock = document.createElement("div");
		statBlock.style.flex = "1";

		const valEl = document.createElement("div");
		valEl.style.fontSize = "24px";
		valEl.style.color = "#eceff1";
		valEl.style.fontWeight = "300";
		valEl.textContent = String(stat.value);

		const lblEl = document.createElement("div");
		lblEl.style.fontSize = "11px";
		lblEl.style.color = "#969696";
		lblEl.style.textTransform = "uppercase";
		lblEl.style.marginTop = "4px";
		lblEl.style.letterSpacing = "1px";
		lblEl.textContent = stat.label;

		statBlock.append(valEl, lblEl);
		generalStatsContainer.append(statBlock);
	});

	block.append(generalStatsContainer);
}
