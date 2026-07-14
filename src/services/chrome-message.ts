export function sendFetchMessage(url: string): Promise<string | null> {
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
