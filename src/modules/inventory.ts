export interface InventoryValue {
	ok: boolean;
	totalValue: number;
	valueText: string;
	totalItems: number;
}

function formatEuros(total: number): string {
	const [intStr, decStr = "00"] = total.toFixed(2).split(".");
	const intPart = parseInt(intStr, 10).toLocaleString("de-DE");
	return `${intPart},${decStr}€`;
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

export async function fetchInventoryValue(
	steamId64: string,
): Promise<InventoryValue> {
	try {
		const url = `https://steamcommunity.com/inventory/${steamId64}/730/2?l=en&count=1000`;
		const res = await fetch(url);
		if (!res.ok) {
			return { ok: false, totalValue: 0, valueText: "N/A", totalItems: 0 };
		}

		const data = await res.json();
		if (!data.success || !data.descriptions || !data.assets) {
			return { ok: false, totalValue: 0, valueText: "N/A", totalItems: 0 };
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
			return { ok: true, totalValue: 0, valueText: "0,00€", totalItems: 0 };
		}

		const names = items.map(([n]) => n);
		const prices = await fetchBulkPrices(names);

		if (!prices) {
			return {
				ok: false,
				totalValue: 0,
				valueText: "N/A",
				totalItems: 0,
			};
		}

		let total = 0;
		for (const [name, count] of items) {
			total += (prices[name] || 0) * count;
		}

		const totalItems = items.reduce((s, [, c]) => s + c, 0);

		return {
			ok: true,
			totalValue: total,
			valueText: formatEuros(total),
			totalItems,
		};
	} catch {
		return { ok: false, totalValue: 0, valueText: "N/A", totalItems: 0 };
	}
}
