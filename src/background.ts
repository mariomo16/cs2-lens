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
});
