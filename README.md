# Frontend: Quantly NFT Launchpad & Marketplace (QMS)

Vite + React 18 + TypeScript, wagmi + viem. Purple and white design built on the QMS logo purple (#7A5CFF), with a
dark theme the visitor can switch to; Bricolage Grotesque (headings), Geist (text) and Geist Mono, all self-hosted.
English. Everything runs on **QMS Testnet** (chain 19480) against the deployed contracts.

Quantly is an independent project. It uses the QMS purple so it feels at home on the chain, but it has its own logo
(it does not use the QMS mark) and says in the footer that it is not affiliated with QMS Network.

## Run locally (PowerShell)

```powershell
cd frontend
npm install
Copy-Item .env.example .env   # VITE_API_URL=http://localhost:8080
npm run dev                   # http://localhost:5173
```

## Netlify

Base directory `frontend`, build command `npm run build`, publish directory `frontend/dist`.
Set `VITE_API_URL` to the Railway API URL. `netlify.toml` already has the SPA redirect.

## Wallets

- **Browser wallets** that support EIP-6963 are detected and listed with their own name and icon: MetaMask,
  Rabby, Phantom, OKX Wallet, Coinbase / Base Wallet and others. Older wallets that only add
  themselves to the page the old way still work.
- **Missing wallets:** Base (Coinbase Wallet) opens its app when the extension is missing. Wallets that are not
  installed show install links, and on phones they show "open in wallet app" links.
- **No silent connect:** the site never connects on its own. Users click Connect, pick a wallet, and approve it in
  the wallet. After a refresh only that same wallet is reconnected, and only if it still allows this site.
  Disconnect forgets it.
- **Wrong network:** the site offers a one-click switch to QMS Testnet and adds the network if the wallet doesn't know it.
- **Transactions:** every one is simulated before the wallet opens, so a transaction that would fail shows a
  clear reason instead of costing gas.
  - Mint amounts are read from the contract at the moment of minting.
  - The mint panel shows the estimated network fee in QMS.
  - A transaction is shown as done after 2 confirmations (`VITE_CONFIRMATIONS`), because QMS has no finality layer yet.
- **Wallets that refuse custom networks** show the reason, and users can pick another wallet.

## Many NFTs at once

On your own profile, press **Select**, pick items (from any of your collections), and use the bar at the bottom:

| Action | Limit | What the wallet asks |
|---|---|---|
| List | 50 items | one signature for all of them (it shows every item and price); no transaction per listing |
| Delist | 100 items | one transaction that cancels all the selected listings |
| Send | 100 items | one transaction that moves them all to the address you typed |

The first time a collection is used, the wallet also asks once to approve the marketplace for it. If some of the
items you send are listed, their listings are cancelled first (one extra transaction; it can be switched off in the
dialog). The code is in `src/components/bulk.tsx` and `src/lib/actions.ts` (`bulkList`, `bulkDelist`, `bulkTransfer`).

## Creators

- **Create page, three ways to add art:**
  1. A single pre-reveal image (launch now, reveal later)
  2. Upload an images folder and a metadata folder to IPFS. The site fills in the image links and names files `1.json`, `2.json`, ...
  3. Paste an existing `ipfs://CID/`
- **Phases:** each phase has its own price, time window, wallet limit and allowlist (paste addresses or upload a CSV/TXT).
- **Studio (`/studio/<collection>`, owner only):**
  - withdraw revenue; pause or resume minting; edit or add phases and replace allowlists
  - **Metadata** (`components/StudioMetadata.tsx`): what collectors see now and the link in use, "Refresh on
    Quantly", upload new metadata or paste a link (reveal before, switch after), change the placeholder before the
    reveal, hide the art (one image for every item; needs IPFS uploads), lock the metadata for good. Deleting is not
    possible on-chain, and the tab explains it.
  - airdrop / team reserve; creator fee and payout address; reduce supply; contract URI
  - **Hand over this collection** (`components/StudioHandover.tsx`): two-step ownership change; the receiving wallet
    sees an Accept screen on the Studio page
  - **Page content** (saved by the API, no gas): logo, banner, up to 3 extra images, description, links, and the
    About tab (story, picture, up to 12 short facts)
- **Pictures are links** (`https://`, `ipfs://`, `ar://`), in any image format. `src/lib/mediaLink.ts` holds the one
  rule for which links are accepted and which media the site will load; the API applies the same rule. Before the
  deploy transaction, the Create page asks the API to check the page details (`POST /api/drops/check`), so a link
  the API would refuse is found while it is still free to fix.
- **Extra images** sit in a column to the right of the main image on the mint page and are listed on the About tab; every picture opens in
  the in-page viewer (`components/ImageViewer.tsx`), never in a new tab.

## Pages

Qubots, the official collection (`/qubots`, also `/official`, with live mint once its contract is set), Home, Explore,
Collection (filters, traits, sweep, offers, holders, activity), Item, Launchpad, Drop (mint), Create (5-step wizard),
Studio, Profile (created collections, privacy switches), Activity, Developers (`/developers`, the read-only API and
API keys), Support (tickets). Navigation: Home, Launchpad, Creator, Activity, Qubots; Explore, FAQ and Developers
are in the phone menu (More) and the footer. The admin panel is a separate app (`../admin`) and is not part of this site.

The active network comes from the backend at startup, so switching to mainnet in the admin panel needs no rebuild.
`netlify.toml` sets a strict Content-Security-Policy and other security headers.
The network chip in the top bar shows the live QMS block; a click opens block age, gas price, the testnet faucet,
the explorer and the QMS status page.
Amounts are shown in QMS / WQMS only: the coin has no market price on testnet (`RATE` in `src/lib/currency.tsx` is
the place to plug a price feed in later).

## Things you may change

| What | Where |
|---|---|
| Brand name / tagline | `BRAND` in `src/config.ts` (and `BRAND_NAME` in the backend) |
| Site logo | Admin → Logo & official collection, or replace `public/logo.svg` |
| Official collection name, supply, logo, banner, artwork | Admin → Logo & official collection |
| Official collection page wording | `src/content/official.ts` |
| Official collection X link | `VITE_OFFICIAL_X` |
| Texts | `src/i18n/en.ts`, `src/content/faq.ts`, `src/content/legal.ts` |
| Colors, radii, type | tokens at the top of `src/styles.css` (`:root` = light, `[data-theme='dark']` = dark); the "Quantly design layer" holds the shared components and "Page layouts" at the end holds each page |
| Default theme | `public/theme.js` and `src/lib/theme.ts` (light unless the visitor chose dark) |
| Animations | `src/lib/motion.ts` and the `q-*` keyframes in `src/styles.css` |
| Contract ABIs | `src/lib/abis.ts` (must match the deployed contracts) |
| Coin symbols | `VITE_NATIVE_SYMBOL`, `VITE_WRAPPED_SYMBOL` (default QMS / WQMS) |

## Design and motion

- **Theme:** light (purple and white) by default. The moon / sun button in the top bar, the footer and the mobile
  menu switches to dark; the choice is remembered on the device. `public/theme.js` applies it before the first paint.
- **Layout:** floating top bar with a sliding highlight, search palette (`/` or Ctrl/⌘+K), bottom tab bar and a
  bottom sheet on phones. Every page has its own structure (no two pages share a layout):
  - **Home:** the marketplace banner as the background of the first screen with the headline on it, launchpad posters in a scroller, a two-column leaderboard with
    volume bars, the official-collection spotlight, a drifting tape of the latest sales, FAQ in two columns.
  - **Explore:** the top three collections as posters on a podium, the rest as numbered tickets.
  - **Collection:** one hero panel (artwork, name, actions on the left; six stat tiles on the right), a floating pill
    bar for the tabs, status chips in the toolbar, and filters in a panel that slides in from the right
    (from the bottom on phones). Items are borderless tiles with the price on the artwork.
  - **Item:** a three-part stage (facts, artwork, price and actions), then history / offers / chart / details as
    tabs beside the traits and rarity.
  - **Launchpad:** the drop that is minting now as a headline panel, then poster cards.
  - **Mint page:** centred hero with the four key numbers, the mint "ticket" (violet band with the phase and its
    clock) beside the collection facts, and the schedule as a rail of steps.
  - **Activity:** a feed of rows, with the event filters in a side rail.
  - **Profile:** an identity card that stays in view on the left, tabs and content on the right.
  - **Create:** a five-step progress rail across the top, the form, and a live preview card that fills in as you type.
  - **Studio:** header panel and a pill bar. **FAQ:** centred search with one group at a time.
  - **Official collection:** a centred stage with a drifting strip of artwork, the facts as one joined bar.
  - Tables everywhere are rows that float as separate cards.
- **Opening and closing:** dialogs, menus, popovers, the filter drawer, the sweep bar, the lightbox and toasts animate
  in and out. `useExitAnimation` in `src/lib/motion.ts` leaves a lifeless copy of the element on screen for about
  200 ms to play the closing animation, so every way of closing (cross, backdrop, Escape, a route change) looks the
  same. The copy cannot be clicked or focused.
- **Pages:** a new page slides in from the right, going back slides in from the left; Back keeps the scroll position.
- **Speed:** only transform and opacity are animated; the most-used pages are fetched in the background once the
  first page is idle, so moving between them does not wait on the network; fonts are self-hosted.
- **Reduced motion:** with the device setting on, animations and transitions are switched off.

## QMS-specific behaviour

- Blocks are proof-of-work, about 10 seconds apart and uneven, so pending states last longer than on an L2. The mint
  button waits for the chain to reach a phase's start time before sending.
- Reads made at the same moment are batched through Multicall3 (predeployed on QMS) and the site polls every 5 s,
  to stay well inside the public RPC's limit of 50 requests a second per address.
- Offers are paid in WQMS (`VITE_WRAPPED_ADDRESS`, default the verified WQMS contract on QMS Testnet).
- Wallets sign orders for the EIP-712 domain `VITE_MARKET_DOMAIN_NAME` (default `Quantly Market`, the name fixed in
  `QuantlyMarket.sol`). If you change it in the contract, set the same name here and in the backend.

## Link previews (X, Telegram, WhatsApp, Discord)

`netlify/edge-functions/share-card.ts` adds each collection's title, stats and a generated 1200×630 card image
(from `/api/share/collection/<slug>.png`) to the HTML of `/collection`, `/launchpad` and `/item` pages.
It uses the same `VITE_API_URL` environment variable, so nothing extra is needed on Netlify.
