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
    eyebrow: `The official collection of ${o.brand}`,
    lead: `${o.name} are little robots with big characters: kings and astronauts, pilots, chefs and firefighters. They are the collection ${o.brand} itself stands behind.`,
    facts: [
      { label: 'Supply', value: supply, note: o.supply ? 'Written into the contract' : 'Shared before mainnet' },
      { label: 'Mint price', value: 'TBA', note: 'Shared before the mint' },
      { label: 'Mint date', value: 'Mainnet', note: `Revealed when ${o.brand} goes to mainnet` },
      { label: 'Status', value: 'Official', note: `${o.brand}'s own collection` },
    ],
    aboutTitle: `Meet the ${o.name}`,
    aboutLead: `Every one has its own outfit and mood. Pick one to see it up close.`,
    pillars: [],
    artsTitle: 'The whole crew',
    artsLead: `Every ${o.name} artwork shared so far. Tap one to open it full size.`,
    faqTitle: `${o.name} questions`,
    faqLead: 'Short answers about the collection and the mint.',
    faq: [
      { q: `What are ${o.name}?`, a: [
        `${o.name} is the official NFT collection of ${o.brand}: a crew of small robots, each with its own costume and personality. It is the only collection on ${o.brand} with the gold tick.`,
      ] },
      { q: 'How many will there be?', a: [
        o.supply
          ? `${supply}. That is the maximum written into the collection contract. It can be lowered later, never raised.`
          : 'The supply is shared before mainnet. Once the contract is live, the maximum is written into it and can only go down, never up.',
      ] },
      { q: 'When is the mint, and what will it cost?', a: [
        `The mint date is revealed when ${o.brand} launches on mainnet. The price is shared on this page before the mint opens.`,
        'When you mint, your wallet shows the exact amount before you confirm, and the contract only accepts that exact amount.',
      ] },
      { q: 'What do I need to mint one?', a: [
        `A browser wallet such as MetaMask, Rabby or OKX Wallet with a little QMS for the network fee. ${o.brand} adds the network to your wallet when you connect.`,
      ] },
      { q: 'How do I know I am on the real mint?', a: [
        'Only mint from this page. The gold tick marks the official collection, and its contract address appears here once it is live.',
        'The team never sends mint links in private messages and never asks for your recovery phrase.',
      ] },
      { q: 'Can I trade them after minting?', a: [
        `Yes, on ${o.brand}, from the first mint: list, buy, sweep several at once, or make an offer on one Qubot or on any Qubot.`,
      ] },
    ],
    joinTitle: `Be early for ${o.name}`,
    joinBody: 'Supply, price and the mint date are shared here and on our X account first.',
    nav: { overview: 'Meet them', market: 'Market', arts: 'Artwork', faq: 'FAQ' },
    ticker: [o.name, o.supply ? `${supply} supply` : 'Supply TBA', 'Official collection', 'Mint price TBA', 'Mint date: on mainnet'],
  };
}
