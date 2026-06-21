// Scryfall requires a descriptive User-Agent and an Accept header on every
// request. Requests without them — or with a default library User-Agent like
// "node"/"undici" — are rejected with HTTP 400 (subcode "generic_user_agent").
// See https://scryfall.com/docs/api
export const SCRYFALL_HEADERS = {
	'User-Agent': 'mtg-svelte-collector/1.0',
	Accept: 'application/json'
};

/**
 * fetch() wrapper that always sends the headers Scryfall requires.
 * Any caller-supplied headers are merged on top.
 */
export function scryfallFetch(url: string, init: RequestInit = {}): Promise<Response> {
	return fetch(url, {
		...init,
		headers: {
			...SCRYFALL_HEADERS,
			...init.headers
		}
	});
}
