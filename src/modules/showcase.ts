import type { PlayerStats } from "./csstats";

export function populateStatsBlock(
	block: HTMLElement,
	stats: PlayerStats,
): void {
	block.style.display = "flex";
	block.style.flexDirection = "column";
	block.style.gap = "20px";

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

	if (stats.premierRatings && stats.premierRatings.length > 0) {
		const premierContainer = document.createElement("div");
		premierContainer.style.display = "flex";
		premierContainer.style.justifyContent = "space-around";
		premierContainer.style.textAlign = "center";

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
			statBlock.style.flex = "1";
			statBlock.style.display = "flex";
			statBlock.style.flexDirection = "column";
			statBlock.style.alignItems = "center";

			const tier = getPremierTier(data.rating);

			const ratingWrapper = document.createElement("div");
			ratingWrapper.style.position = "relative";
			ratingWrapper.style.width = "100px";
			ratingWrapper.style.height = "32px";
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
			ratingVal.style.fontSize = "18px";
			ratingVal.style.fontWeight = "800";
			ratingVal.style.color = tier.color;
			ratingVal.style.textShadow = "0px 2px 4px rgba(0, 0, 0, 0.8)";
			ratingVal.textContent = data.rating
				? data.rating.toLocaleString()
				: "N/A";

			ratingVal.style.paddingLeft = "10px";

			ratingWrapper.append(svgBg, ratingVal);

			// Título debajo
			const lblEl = document.createElement("div");
			lblEl.style.fontSize = "10px";
			lblEl.style.color = "#76808c";
			lblEl.style.textTransform = "uppercase";
			lblEl.style.marginTop = "8px";
			lblEl.style.letterSpacing = "1px";
			lblEl.textContent = data.title;

			statBlock.append(ratingWrapper, lblEl);
			premierContainer.append(statBlock);
		});

		block.append(premierContainer);

		const divider = document.createElement("div");
		divider.style.height = "1px";
		divider.style.background =
			"linear-gradient(90deg, rgba(255,255,255,0.01) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.01) 100%)";
		block.append(divider);
	}

	const generalStatsContainer = document.createElement("div");
	generalStatsContainer.style.display = "flex";
	generalStatsContainer.style.justifyContent = "space-around";
	generalStatsContainer.style.textAlign = "center";
	generalStatsContainer.style.padding = "4px 0";

	const generalStats = [
		{ label: "K/D Ratio", value: stats.kdRatio?.toFixed(2) ?? "0.00" },
		{ label: "HLTV Rating", value: stats.hltvRating?.toFixed(2) ?? "0.00" },
		{ label: "Matches", value: stats.matches ?? 0 },
		{
			label: "Win Rate",
			value: stats.winRate ? `${stats.winRate.toFixed(1)}%` : "0.0%",
		},
	];

	generalStats.forEach((stat) => {
		const statBlock = document.createElement("div");
		statBlock.style.flex = "1";

		const valEl = document.createElement("div");
		valEl.style.fontSize = "24px";
		valEl.style.color = "#eceff1";
		valEl.style.fontWeight = "300";
		valEl.style.height = "28px";
		valEl.style.display = "flex";
		valEl.style.justifyContent = "center";
		valEl.style.alignItems = "center";
		valEl.textContent = String(stat.value);

		const lblEl = document.createElement("div");
		lblEl.style.fontSize = "10px";
		lblEl.style.color = "#76808c";
		lblEl.style.textTransform = "uppercase";
		lblEl.style.marginTop = "8px";
		lblEl.style.letterSpacing = "1px";
		lblEl.textContent = stat.label;

		statBlock.append(valEl, lblEl);
		generalStatsContainer.append(statBlock);
	});

	block.append(generalStatsContainer);
}
