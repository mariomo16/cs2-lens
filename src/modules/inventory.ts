export interface InventoryValue {
	ok: boolean;
	steamValue: number;
	steamText: string;
	totalItems: number;
	csfloatText: string;
}

function formatEuros(total: number): string {
	const [intStr, decStr = "00"] = total.toFixed(2).split(".");
	const intPart = parseInt(intStr, 10).toLocaleString("de-DE");
	return `${intPart},${decStr}€`;
}

function fetchViaBackground(url: string): Promise<string | null> {
	return new Promise((resolve) => {
		chrome.runtime.sendMessage(
			{ type: "FETCH", url },
			(response: { ok: boolean; body?: string }) => {
				if (chrome.runtime.lastError || !response?.ok) {
					resolve(null);
				} else {
					resolve(response.body ?? null);
				}
			},
		);
	});
}

function fetchBulkPrices(
	names: string[],
): Promise<Record<string, number> | null> {
	return new Promise((resolve) => {
		chrome.runtime.sendMessage(
			{ type: "BULK_PRICES", names },
			(response: { ok: boolean; prices?: Record<string, number> }) => {
				if (chrome.runtime.lastError || !response?.ok) {
					resolve(null);
				} else {
					resolve(response.prices ?? null);
				}
			},
		);
	});
}

async function fetchCSFloatPrices(
	names: string[],
): Promise<Map<string, number>> {
	const prices = new Map<string, number>();
	const BATCH = 3;
	for (let i = 0; i < names.length; i += BATCH) {
		await Promise.allSettled(
			names.slice(i, i + BATCH).map(async (name) => {
				const url = `https://csfloat.com/api/v1/listings?market_hash_name=${encodeURIComponent(name)}&type=buy_now&sort_by=price&limit=1`;
				const json = await fetchViaBackground(url);
				if (!json) return;
				try {
					const data = JSON.parse(json);
					const listing = data?.data?.[0] ?? data?.[0];
					if (listing?.price) {
						prices.set(name, listing.price / 100);
					}
				} catch {
					// skip
				}
			}),
		);
		if (i + BATCH < names.length) {
			await new Promise((r) => setTimeout(r, 800));
		}
	}
	return prices;
}

export async function fetchInventoryValue(
	steamId64: string,
	onCSFloat?: (text: string) => void,
): Promise<InventoryValue> {
	try {
		const url = `https://steamcommunity.com/inventory/${steamId64}/730/2?l=en&count=1000`;
		const res = await fetch(url);
		if (!res.ok) {
			return {
				ok: false,
				steamValue: 0,
				steamText: "N/A",
				totalItems: 0,
				csfloatText: "",
			};
		}

		const data = await res.json();
		if (!data.success || !data.descriptions || !data.assets) {
			return {
				ok: false,
				steamValue: 0,
				steamText: "N/A",
				totalItems: 0,
				csfloatText: "",
			};
		}

		const descMap = new Map<string, string>();
		for (const desc of data.descriptions) {
			if (desc.market_hash_name) {
				const key = `${desc.classid}_${desc.instanceid || "0"}`;
				descMap.set(key, desc.market_hash_name);
			}
		}

		const counts = new Map<string, number>();
		for (const asset of data.assets) {
			const key = `${asset.classid}_${asset.instanceid || "0"}`;
			const name = descMap.get(key);
			if (name) {
				counts.set(name, (counts.get(name) || 0) + 1);
			}
		}

		const items = Array.from(counts.entries());
		if (items.length === 0) {
			return {
				ok: true,
				steamValue: 0,
				steamText: "0,00€",
				totalItems: 0,
				csfloatText: "0,00€",
			};
		}

		const names = items.map(([n]) => n);

		// Start CSFloat fetch (fire-and-forget, updates via callback)
		const csfloatPromise = fetchCSFloatPrices(names).catch(
			() => new Map<string, number>(),
		);

		// Fetch Steam prices from Skinport (fast, single request)
		const steamPrices = await fetchBulkPrices(names);
		if (!steamPrices) {
			return {
				ok: false,
				steamValue: 0,
				steamText: "N/A",
				totalItems: 0,
				csfloatText: "",
			};
		}

		let steamTotal = 0;
		for (const [name, count] of items) {
			steamTotal += (steamPrices[name] || 0) * count;
		}

		const totalItems = items.reduce((s, [, c]) => s + c, 0);

		// Resolve CSFloat in background and update UI when done
		csfloatPromise.then((csfloatPrices) => {
			let csfloatTotal = 0;
			for (const [name, count] of items) {
				csfloatTotal += (csfloatPrices.get(name) || 0) * count;
			}
			onCSFloat?.(formatEuros(csfloatTotal));
		});

		return {
			ok: true,
			steamValue: steamTotal,
			steamText: formatEuros(steamTotal),
			totalItems,
			csfloatText: "...",
		};
	} catch {
		return {
			ok: false,
			steamValue: 0,
			steamText: "N/A",
			totalItems: 0,
			csfloatText: "",
		};
	}
}
