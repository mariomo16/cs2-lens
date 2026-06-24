import type { PlayerStats } from "./csstats";

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

	if (stats.premierRatings && stats.premierRatings.length > 0) {
		const premierContainer = document.createElement("div");
		premierContainer.className = "csl-premier-container";

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
			{ title: "Current Rating", rating: currentPremier.latestRating },
			{ title: "Best Rating", rating: bestPremier.bestRating },
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
				ratingVal.textContent = "N/A";
			}

			ratingWrapper.append(svgBg, ratingVal);

			// Título debajo
			const lblEl = document.createElement("div");
			lblEl.className = "csl-stat-label";
			lblEl.textContent = data.title;

			statBlock.append(ratingWrapper, lblEl);
			premierContainer.append(statBlock);
		});

		block.append(premierContainer);

		const divider = document.createElement("div");
		divider.className = "csl-divider";
		block.append(divider);
	}

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
}
