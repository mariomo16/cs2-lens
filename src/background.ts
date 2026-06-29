interface PriceEntry {
	market_hash_name: string;
	min_price: number;
}

let priceCache: { map: Map<string, number>; timestamp: number } | null = null;
const CACHE_TTL = 30 * 60 * 1000;

async function fetchPriceCatalog(): Promise<Map<string, number>> {
	const res = await fetch(
		"https://api.skinport.com/v1/items?app_id=730&currency=EUR",
	);
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	const data: PriceEntry[] = await res.json();
	const map = new Map<string, number>();
	if (Array.isArray(data)) {
		for (const entry of data) {
			if (
				entry.market_hash_name &&
				typeof entry.min_price === "number" &&
				entry.min_price > 0
			) {
				map.set(entry.market_hash_name, entry.min_price);
			}
		}
	}
	return map;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
	if (message.type === "FETCH" && typeof message.url === "string") {
		(async () => {
			try {
				const res = await fetch(message.url);
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const body = await res.text();
				sendResponse({ ok: true, body });
			} catch {
				sendResponse({ ok: false });
			}
		})();
		return true;
	}

	if (message.type === "BULK_PRICES" && Array.isArray(message.names)) {
		(async () => {
			try {
				const now = Date.now();
				if (!priceCache || now - priceCache.timestamp > CACHE_TTL) {
					const map = await fetchPriceCatalog();
					priceCache = { map, timestamp: now };
				}

				const result: Record<string, number> = {};
				for (const name of message.names) {
					const price = priceCache.map.get(name);
					if (price !== undefined) {
						result[name] = price;
					}
				}

				sendResponse({ ok: true, prices: result });
			} catch {
				sendResponse({ ok: false });
			}
		})();
		return true;
	}
});
