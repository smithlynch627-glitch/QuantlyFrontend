// Text and reference tables for the Developers page (/developers). Kept here so the docs can be edited
// without touching the page code. Everything describes the real /api/v1 behaviour in backend/src/routes/v1.js.

export type Route = { path: string; what: string; params?: string };
export type RouteGroup = { title: string; routes: Route[] };

export const ROUTES: RouteGroup[] = [
  {
    title: 'Your key and the marketplace',
    routes: [
      { path: '/me', what: 'Your key: its limits, and how much of them you used today and this minute.' },
      { path: '/stats', what: 'Marketplace totals: collections, sales and volume in the last 24 hours, mints.' },
    ],
  },
  {
    title: 'Collections and items',
    routes: [
      { path: '/collections', what: 'Collections, busiest first.', params: 'sort = volume_24h, volume, new, floor, sales · q · verified · featured · creator' },
      { path: '/collections/{slug or address}', what: 'One collection, with its mint details when it launched here.' },
      { path: '/collections/{slug}/tokens', what: 'Items in a collection, by number.', params: 'owner · listed=true' },
      { path: '/tokens/{collection}/{id}', what: 'One item: owner, traits with how many items share them, rank, best listing and offers.' },
    ],
  },
  {
    title: 'Trading',
    routes: [
      { path: '/listings', what: 'Items for sale, with the signed order a buyer needs.', params: 'collection · token_id · maker · sort = price_asc, newest' },
      { path: '/offers', what: 'Open offers on items and on whole collections.', params: 'kind = offer, collection_offer · collection · token_id · maker · sort = price_desc, newest' },
      { path: '/activity', what: 'Sales, mints, transfers, listings and offers, newest first.', params: 'type · collection · token_id · since · before · after' },
    ],
  },
  {
    title: 'Launchpad and wallets',
    routes: [
      { path: '/drops', what: 'Launchpad drops with their phases, minting now first.', params: 'status = live, upcoming, ended, sold_out' },
      { path: '/users/{address}/tokens', what: 'Items a wallet holds, unless the wallet hides them.', params: 'collection' },
      { path: '/users/{address}/activity', what: 'A wallet\'s history, unless the wallet hides it.', params: 'same as /activity' },
    ],
  },
];

export const ACTIVITY_TYPES = 'sale, mint, transfer, list, delist, offer, collection_offer, offer_cancel, cancel';

export type ErrorRow = { status: number; code: string; meaning: string };
export const ERRORS: ErrorRow[] = [
  { status: 400, code: 'key_in_url', meaning: 'The key was put in the link. Send it in the X-API-Key header instead, then replace the key: links end up in logs.' },
  { status: 400, code: 'invalid_address', meaning: 'A wallet or collection address is not a valid 0x address.' },
  { status: 400, code: 'invalid_token', meaning: 'The item number is not a whole number.' },
  { status: 400, code: 'invalid_cursor', meaning: 'A cursor, before or after value was not copied from an earlier answer.' },
  { status: 400, code: 'invalid_type', meaning: 'Unknown activity type. The message lists the ones that exist.' },
  { status: 400, code: 'invalid_since', meaning: 'since must be a date and time, for example 2026-10-01T00:00:00Z.' },
  { status: 400, code: 'bad_request', meaning: 'Another parameter is missing or not in the expected form. The message says which.' },
  { status: 401, code: 'api_key_required', meaning: 'No key was sent.' },
  { status: 401, code: 'invalid_key', meaning: 'The key is wrong, or it was replaced with a new one.' },
  { status: 401, code: 'key_revoked', meaning: 'The key was revoked and can\'t be used again. Ask for a new one.' },
  { status: 403, code: 'key_paused', meaning: 'The team paused the key. Contact support.' },
  { status: 403, code: 'private', meaning: 'That wallet hides its items or its activity.' },
  { status: 404, code: 'not_found', meaning: 'No such collection, item or route.' },
  { status: 405, code: 'method_not_allowed', meaning: 'The API only reads. Use GET.' },
  { status: 429, code: 'rate_limited', meaning: 'Too many requests this minute. Wait for the seconds in Retry-After.' },
  { status: 429, code: 'daily_limit', meaning: 'The day\'s requests are used up. The count starts again at midnight UTC.' },
  { status: 429, code: 'too_many_failures', meaning: 'Too many wrong keys from your address. Wait, then check the key you send.' },
  { status: 429, code: 'ip_limit', meaning: 'Too many requests from one address across all keys.' },
  { status: 500, code: 'server_error', meaning: 'Something failed on our side. Try again a little later.' },
  { status: 503, code: 'database', meaning: 'The data store is busy or out of reach. Try again a little later.' },
];

export const RULES: string[] = [
  'Keep your key on your own server or bot. Never put it in a website, an app, a browser extension or public code: anyone who sees it can use up your limits.',
  'The API only reads public marketplace data. It can\'t move NFTs or coins, and it never needs a wallet signature. Nobody from {brand} will ever ask for your seed phrase or private key.',
  'One key per project. A wallet can hold up to {maxKeys} keys and have one request waiting at a time.',
  'Stay within your limits. Keys that keep hitting them, or that are used to harm people or the marketplace, are paused or revoked.',
  'Respect privacy. Wallets that hide their items or activity stay hidden in the API too, so don\'t try to rebuild those lists another way.',
  'If you show the data publicly, say it comes from {brand}.',
  'While {brand} runs on testnet, routes can change. Lists always keep the same shape: data and next.',
];

/** The JSON shown in the page's opening example. Shortened, but every field exists in the real answer. */
export const SAMPLE_RESPONSE = `{
  "data": [
    {
      "slug": "aurora-tiles",
      "name": "Aurora Tiles",
      "address": "0x8f3c…a21e",
      "floor_wei": "250000000000000000",
      "volume_24h_wei": "4100000000000000000",
      "owners_count": 412,
      "verified": true
    }
  ],
  "next": "eyJvIjoxfQ"
}`;
