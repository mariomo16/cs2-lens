import type { FaceitStats, PlayerStats } from "./csstats";

export function populateStatsBlock(
	block: HTMLElement,
	stats: PlayerStats,
): void {
	const getPremierTier = (rating: number | null) => {
		if (!rating) return { color: "#ded6cc", file: "grey.svg" };
		if (rating < 5000) return { color: "#b0c3d9", file: "grey.svg" };
		if (rating < 10000) return { color: "#5e98d9", file: "lightblue.svg" };
		if (rating < 15000) return { color: "#4b69ff", file: "blue.svg" };
		if (rating < 20000) return { color: "#8847ff", file: "purple.svg" };
		if (rating < 25000) return { color: "#d32ce6", file: "pink.svg" };
		if (rating < 30000) return { color: "#eb4b4b", file: "red.svg" };
		return { color: "#e4ae39", file: "gold.svg" };
	};

	const hasPremier = stats.premierRatings && stats.premierRatings.length > 0;

	const container = document.createElement("div");
	container.className = "csl-premier-container";

	if (hasPremier) {
		const sortedBySeason = [...stats.premierRatings].sort(
			(a, b) => b.season - a.season,
		);
		const currentPremier = sortedBySeason[0];

		const bestPremier = stats.premierRatings.reduce((max, current) => {
			const maxVal = max.bestRating ?? 0;
			const currentVal = current.bestRating ?? 0;
			return currentVal > maxVal ? current : max;
		}, stats.premierRatings[0]);

		const displayRatings = [
			{ title: "Current", rating: currentPremier.latestRating },
			{ title: "Best", rating: bestPremier.bestRating },
		];

		displayRatings.forEach((data) => {
			const statBlock = document.createElement("div");
			statBlock.className = "csl-premier-stat-block";

			const tier = getPremierTier(data.rating);

			const ratingWrapper = document.createElement("div");
			ratingWrapper.className = "csl-rating-wrapper";

			const svgBg = document.createElement("div");
			svgBg.className = "csl-svg-bg";
			svgBg.style.backgroundImage = `url("${chrome.runtime.getURL(`assets/premier/${tier.file}`)}")`;

			const ratingVal = document.createElement("div");
			ratingVal.className = "cs2-lens-premier-rating csl-premier-rating";
			ratingVal.style.color = tier.color;

			if (data.rating) {
				const ratingStr = data.rating.toLocaleString();
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
			container.append(statBlock);
		});
	}

	block.append(container);

	const divider = document.createElement("div");
	divider.className = "csl-divider";
	block.append(divider);

	const generalStatsContainer = document.createElement("div");
	generalStatsContainer.className = "csl-general-stats-container";

	const generalStats = [
		{ label: "K/D Ratio", value: stats.kdRatio?.toFixed(2) ?? "0.00" },
		{ label: "HLTV Rating", value: stats.hltvRating?.toFixed(2) ?? "0.00" },
		{ label: "Matches", value: stats.matches ?? 0 },
		{
			label: "Win Rate",
			value: stats.winRate ? `${stats.winRate.toFixed(0)}%` : "0%",
		},
	];

	generalStats.forEach((stat) => {
		const statBlock = document.createElement("div");
		statBlock.className = "csl-general-stat-block";

		const valEl = document.createElement("div");
		valEl.className = "csl-general-stat-value";
		valEl.textContent = String(stat.value);

		const lblEl = document.createElement("div");
		lblEl.className = "csl-stat-label";
		lblEl.textContent = stat.label;

		statBlock.append(valEl, lblEl);
		generalStatsContainer.append(statBlock);
	});

	block.append(generalStatsContainer);

	if (stats.trackingDisabled) {
		const notice = document.createElement("p");
		notice.className = "csl-tracking-notice";
		notice.textContent =
			"This player has not set up match tracking. Stats may be incomplete.";
		block.append(notice);
	} else if (stats.trackingInactive) {
		const notice = document.createElement("p");
		notice.className = "csl-tracking-notice csl-tracking-notice--inactive";
		notice.textContent =
			"A Valve match from the past 30 days is required to reactivate. Stats may be incomplete.";
		block.append(notice);
	}
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

	infoEl.append(link);
	infoEl.style.display = "";
}

export function appendFaceitPlaceholder(block: HTMLElement): void {
	const container = block.querySelector(".csl-premier-container");
	if (!container) return;
	if (container.querySelector(".csl-faceit-block")) return;

	const faceitBlock = document.createElement("div");
	faceitBlock.className = "csl-premier-stat-block csl-faceit-block";

	const ratingWrapper = document.createElement("div");
	ratingWrapper.className = "csl-rating-wrapper";

	const svgBg = document.createElement("div");
	svgBg.className = "csl-svg-bg csl-faceit-svg-bg";
	svgBg.style.backgroundImage = `url("${chrome.runtime.getURL("assets/faceit/unranked.svg")}")`;

	ratingWrapper.append(svgBg);

	const lblEl = document.createElement("div");
	lblEl.className = "csl-stat-label";
	lblEl.textContent = "Unranked";

	faceitBlock.append(ratingWrapper, lblEl);
	container.append(faceitBlock);
}

export function appendFaceitBlock(
	block: HTMLElement,
	faceit: FaceitStats,
): void {
	const faceitLevel = faceit.level ?? 0;
	let container = block.querySelector(".csl-premier-container");

	if (!container) {
		container = document.createElement("div");
		container.className = "csl-premier-container";
		block.insertBefore(container, block.querySelector(".csl-divider"));
		if (!block.querySelector(".csl-divider")) {
			const divider = document.createElement("div");
			divider.className = "csl-divider";
			block.insertBefore(
				divider,
				block.querySelector(".csl-general-stats-container"),
			);
		}
	}

	let faceitBlock = container.querySelector(
		".csl-faceit-block",
	) as HTMLElement | null;
	if (!faceitBlock) {
		faceitBlock = document.createElement("div");
		faceitBlock.className = "csl-premier-stat-block csl-faceit-block";
		container.append(faceitBlock);
	}

	faceitBlock.innerHTML = "";

	const ratingWrapper = document.createElement("div");
	ratingWrapper.className = "csl-rating-wrapper";

	const svgBg = document.createElement("div");
	svgBg.className = "csl-svg-bg csl-faceit-svg-bg";
	const isChallenger =
		faceitLevel === 10 &&
		faceit.global_rank != null &&
		faceit.global_rank <= 1000;
	let svgFile: string;
	if (faceit.global_rank === 1) svgFile = "challenger1.svg";
	else if (faceit.global_rank === 2) svgFile = "challenger2.svg";
	else if (faceit.global_rank === 3) svgFile = "challenger3.svg";
	else if (isChallenger) svgFile = "challenger.svg";
	else svgFile = `${Math.max(1, faceitLevel)}.svg`;
	svgBg.style.backgroundImage = `url("${chrome.runtime.getURL(`assets/faceit/${svgFile}`)}")`;

	ratingWrapper.append(svgBg);

	if (faceit.elo) {
		const lblEl = document.createElement("div");
		lblEl.className = "csl-stat-label";
		lblEl.textContent = `${faceit.elo?.toLocaleString()} ELO`;

		faceitBlock.append(ratingWrapper, lblEl);
	} else faceitBlock.append(ratingWrapper);
}
