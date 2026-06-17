chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
	if (message.type === "FETCH" && typeof message.url === "string") {
		fetch(message.url)
			.then((res) => {
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				return res.text();
			})
			.then((body) => sendResponse({ ok: true, body }))
			.catch(() => sendResponse({ ok: false }));

		return true;
	}
});
