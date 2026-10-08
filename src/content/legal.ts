// Built-in Terms of Use and Privacy Policy. Written for how the marketplace actually works; have them
// reviewed for your jurisdiction before mainnet. The admin panel can replace them without a redeploy.
export type Section = { h: string; p: string[] };
export type Doc = { title: string; intro: string; sections: Section[] };
export const UPDATED = '2026-10-08';

export const legalDocs = (name: string): { terms: Record<'en', Doc>; privacy: Record<'en', Doc> } => {
const TERMS: Record<'en', Doc> = {
  en: {
    title: 'Terms of Use',
    intro: `These terms are the agreement between you and ${name} for the website, the launchpad and the marketplace. When you connect a wallet or use any part of the site, you accept them. If you do not accept them, do not use ${name}.`,
    sections: [
      { h: '1. The service', p: [`${name} is a website that lets you talk to smart contracts on the QMS network. Creators use it to publish NFT collections; everyone can use it to mint, list, buy, sell and make offers. ${name} is an independent project. It is not run by the QMS Network team and has no affiliation with it.`, `${name} does not take custody of anything. Your NFTs and coins stay in your wallet, and every mint and trade is carried out by the smart contracts, wallet to wallet.`] },
      { h: '2. Test network', p: ['At present the site is connected to QMS Testnet. Testnet coins and NFTs exist for testing only and have no money value. Whoever operates the network can reset it without notice. A reset removes balances, NFTs, listings and history, and we have no way to bring them back.'] },
      { h: '3. Who may use it, and your wallet', p: ['You must be 18 or older, and using this kind of service must be legal where you live.', 'Your wallet, its keys and every transaction or message you approve are your responsibility. We never ask for a seed phrase or a private key. A transaction that is on the blockchain cannot be undone, by you or by us.'] },
      { h: '4. Fees', p: ['Each sale carries a marketplace fee and, where the creator has set one, a creator fee. Each paid mint carries a platform fee. The contracts cap the marketplace fee at 10% and the creator fee at 10%. You see the amounts before you confirm. Network gas is paid to the network and never to us.'] },
      { h: '5. Rules for creators', p: ['When you publish a collection you state that the artwork and content are yours to use, that what you tell collectors is true, and that you will keep the promises you make to them.', 'Prices, times, wallet limits and allowlists are enforced by your own collection contract. If you change them after minting has begun, the mint page shows collectors what changed.'] },
      { h: '6. What you may not do', p: ['Deceive or impersonate anyone; trade with yourself or otherwise manipulate prices; publish stolen work or work that infringes someone\'s rights; spread malware; publish content that harms minors; or use the service in breach of sanctions or any other law.'] },
      { h: '7. What we may remove', p: ['To protect users or to comply with the law, we may hide a collection or an item, stop it from being traded on this site, or limit an account. That affects this website only. It changes nothing on the blockchain.', 'We may also pause or revoke a developer API key that breaks the API rules on the Developers page.'] },
      { h: '8. Risks you accept', p: ['The price of an NFT can fall fast and can reach zero. Smart contracts may contain errors even after review and testing. A network can be slow, congested or offline. You use the service at your own risk.'] },
      { h: '9. No advice, no guarantee', p: [`Nothing on ${name} is financial, legal or tax advice. The service is provided "as is", without a warranty of any kind.`] },
      { h: '10. Limit of our liability', p: ['As far as the law permits, we are not liable for indirect or consequential loss, for lost profit, or for loss caused by a wallet, a network, a smart contract or a third party.'] },
      { h: '11. Changes to these terms', p: ['We may revise these terms. The date at the top is the date of the current version. If you keep using the site after a change, you accept the revised terms.'] },
      { h: '12. Reaching us', p: ['For questions and reports, send a ticket from the Support page.'] },
    ],
  },
};

const PRIVACY: Record<'en', Doc> = {
  en: {
    title: 'Privacy Policy',
    intro: `This policy says what ${name} keeps about you, what it is used for, and what you can do about it. We keep as little as the service needs.`,
    sections: [
      { h: '1. Information we handle', p: ['Your wallet address and what it does on-chain: mints, listings, sales and offers. All of this is public on the blockchain already.', 'The message you sign to sign in. It proves the wallet is yours, costs nothing and cannot move anything.', 'What you choose to put in your profile, and the support tickets you send. Contact details in a ticket are stored encrypted.', 'If you connect an X account as a creator: your X username and account ID, which are shown on your collection. We do not receive your X password, posts, followers or messages.', 'If you ask for a developer API key: the project name, what it is for, an optional website, an optional contact (stored encrypted) and a daily count of the requests made with the key. The key itself is never stored, only a fingerprint that cannot be turned back into it.', 'Technical records such as IP address and request logs. They are used to keep the service secure and to limit abuse, and are kept for a short time only.'] },
      { h: '2. Information we never ask for', p: ['Seed phrases, private keys and payment card details. The site carries no advertising trackers.'] },
      { h: '3. What it is used for', p: ['Showing collections, items, prices and activity; letting you sign in and manage your collections; answering your support tickets; and protecting the service.'] },
      { h: '4. Public blockchain data', p: ['Everything recorded on QMS is public and can be read by anyone. Nobody, including us, can edit or remove it.'] },
      { h: '5. Companies that help us run the service', p: ['Hosting, database, blockchain RPC and IPFS providers process data on our behalf so the site can work. The wallet app you connect follows its own privacy policy.'] },
      { h: '6. What is kept in your browser', p: ['The wallet you last connected, your sign-in session and your light or dark theme choice are saved in your browser. You can clear them whenever you want.'] },
      { h: '7. How long we keep things', p: ['Marketplace data mirrors the blockchain for as long as the chain holds it. Support tickets are kept for as long as they are needed to help you. Security logs are kept only briefly.'] },
      { h: '8. How it is protected', p: ['Traffic is encrypted with HTTPS, access to the database is restricted to the service itself, and sensitive fields are encrypted where they are stored.'] },
      { h: '9. What you can do', p: ['Edit your profile, disconnect your wallet at any moment, and ask us through the Support page to delete your profile details or your tickets.', 'Hide your collected items or your activity from others with the switches on your profile. This covers Quantly\'s pages and API only: the blockchain and its explorers stay public.', 'Revoke your API keys on the Developers page whenever you like.'] },
      { h: '10. Age limit', p: [`${name} is not meant for anyone under 18.`] },
      { h: '11. Changes and questions', p: ['We may revise this policy. The date at the top is the date of the current version. If you have a question, send a ticket from the Support page.'] },
    ],
  },
};
return { terms: TERMS, privacy: PRIVACY };
};

/** The built-in text in the admin editor's format: intro, then "## Heading" and paragraphs. */
export const docToText = (d: Doc) => [d.intro, ...d.sections.map((x) => [`## ${x.h}`, ...x.p].join('\n\n'))].join('\n\n');
