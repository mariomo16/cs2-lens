export interface InventoryValue {
	ok: boolean;
	totalValue: number;
	valueText: string;
	totalItems: number;
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
			return { ok: true, totalValue: 0, valueText: "$0.00", totalItems: 0 };
		}

		const prices = new Map<string, number>();
		const BATCH = 5;
		for (let i = 0; i < items.length; i += BATCH) {
			await Promise.allSettled(
				items.slice(i, i + BATCH).map(async ([name]) => {
					const priceUrl = `https://steamcommunity.com/market/priceoverview/?appid=730&currency=1&market_hash_name=${encodeURIComponent(name)}`;
					const priceRes = await fetch(priceUrl);
					if (!priceRes.ok) return;
					const json = await priceRes.json();
					if (json.success && json.lowest_price) {
						const num = parseFloat(json.lowest_price.replace(/[^0-9.]/g, ""));
						if (!Number.isNaN(num)) prices.set(name, num);
					}
				}),
			);

			if (i + BATCH < items.length) {
				await new Promise((r) => setTimeout(r, 100));
			}
		}

		let total = 0;
		for (const [name, count] of items) {
			total += (prices.get(name) || 0) * count;
		}

		const totalItems = items.reduce((s, [, c]) => s + c, 0);

		return {
			ok: true,
			totalValue: total,
			valueText: `$${total.toFixed(2)}`,
			totalItems,
		};
	} catch {
		return { ok: false, totalValue: 0, valueText: "N/A", totalItems: 0 };
	}
}
