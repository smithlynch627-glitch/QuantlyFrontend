// Official-collection page content. The collection's name, supply and artwork come from the admin panel
// (Branding); edit this file to change the wording around them.
import type { FaqItem } from './faq';

export interface OfficialFact { label: string; value: string; note: string }
export interface OfficialPillar { title: string; body: string }

export interface OfficialContent {
  eyebrow: string;
  lead: string;
  facts: OfficialFact[];
  aboutTitle: string;
  aboutLead: string;
  pillars: OfficialPillar[];
  artsTitle: string;
  artsLead: string;
  faqTitle: string;
  faqLead: string;
  faq: FaqItem[];
  joinTitle: string;
  joinBody: string;
  nav: { overview: string; market: string; arts: string; faq: string };
  ticker: string[];
}

export function officialContent(o: { name: string; supply: number | null; brand: string; chain: string }): OfficialContent {
  const supply = o.supply ? o.supply.toLocaleString('en-US') : 'TBA';
  return {
    eyebrow: `Official collection of ${o.brand}`,
    lead: `${o.name} is the official NFT collection of ${o.brand}, minted and traded on ${o.chain}. Supply, mint price and date are announced here first.`,
    facts: [
      { label: 'Supply', value: supply, note: o.supply ? 'Fixed in the contract' : 'To be announced' },
      { label: 'Mint price', value: 'TBA', note: 'Announced before mint' },
      { label: 'Mint date', value: 'TBA', note: 'Announced on this page' },
      { label: 'Status', value: 'Official', note: `Collection of ${o.brand}` },
    ],
    aboutTitle: 'What makes it official',
    aboutLead: `${o.name} is the collection the marketplace itself stands behind.`,
    pillars: [
      { title: 'Official', body: `The official collection of ${o.brand}, marked with the gold tick everywhere on the site.` },
      { title: 'Fixed supply', body: 'The maximum supply is written into the contract. It can be reduced, never raised.' },
      { title: 'Fair mint', body: 'Exact on-chain price, per-wallet limits and allowlist proofs enforced by the contract.' },
      { title: `Native to ${o.chain}`, body: `Minted and traded on ${o.chain}, with every mint, listing and sale on-chain.` },
    ],
    artsTitle: 'Artwork',
    artsLead: `A first look at ${o.name}.`,
    faqTitle: 'Collection FAQ',
    faqLead: `Everything about ${o.name} in one place.`,
    faq: [
      { q: `What is ${o.name}, in one line?`, a: [
        `It is ${o.brand}'s own NFT collection on ${o.chain}: the one collection the marketplace puts its name to. You can recognise it by the gold tick, which no other collection has.`,
      ] },
      { q: 'What is the total supply?', a: [
        o.supply
          ? `${supply}. That number is the maximum written into the collection contract. It can be lowered, never raised.`
          : 'It has not been announced yet. When the collection contract is deployed, the maximum supply is written into it; it can be lowered after that, never raised.',
      ] },
      { q: 'When does the mint open, and at what price?', a: [
        'The date and the price are published on this page before the mint opens.',
        'At mint, your wallet shows the exact amount before you confirm, and the contract accepts that exact amount only: not less, not more.',
      ] },
      { q: 'What do I need to take part?', a: [
        `An EVM wallet such as MetaMask, Rabby or OKX Wallet, and a little ${o.chain} gas. ${o.brand} adds the network to your wallet when you connect.`,
      ] },
      { q: 'How can I be sure it is the real collection?', a: [
        'Mint from this page and nowhere else. The gold tick marks the official collection, and its contract address is shown here as soon as it is deployed.',
        'Nobody from the team will send you a mint link in a private message, and nobody will ask for your seed phrase.',
      ] },
      { q: 'Can I sell or buy it after the mint?', a: [
        `Yes, on ${o.brand}, from the first mint. You can list items, buy them, sweep the floor, and make an offer on one item or on the whole collection.`,
      ] },
    ],
    joinTitle: 'Stay in the loop',
    joinBody: 'The supply, mint price and mint date are announced here and on our official X first.',
    nav: { overview: 'Overview', market: 'Market', arts: 'Artwork', faq: 'FAQ' },
    ticker: [o.name, o.supply ? `${supply} supply` : 'Supply TBA', 'Official collection', 'Mint price TBA', `Built on ${o.chain}`],
  };
}
