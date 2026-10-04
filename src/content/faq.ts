// Marketplace & Launchpad FAQ. {market} and {mint} are replaced with the live fees from the contracts.
import type { Lang } from '../i18n';

export interface FaqItem { q: string; a: string[] }
export interface FaqGroup { id: 'marketplace' | 'launchpad' | 'safety'; title: string; intro: string; items: FaqItem[] }

const EN: FaqGroup[] = [
  {
    id: 'marketplace',
    title: 'Marketplace',
    intro: 'Trading on Quantly: wallets, listings, offers and what a sale costs.',
    items: [
      { q: 'What can I do on Quantly?', a: [
        'Quantly is two things in one site: a launchpad where creators publish NFT collections, and a marketplace where those collections are minted, listed, bought and bid on. It runs on QMS, an EVM-compatible Layer 1. Quantly is an independent project; the QMS team does not operate it.',
        'For now the site is connected to QMS Testnet. Nothing on a testnet has money value, and QMS has announced that the testnet will be reset. After a reset, balances, NFTs, listings and history start from zero.',
      ] },
      { q: 'Do I need to create an account?', a: [
        'No. Your wallet is your account. MetaMask, Rabby, OKX Wallet, Coinbase Wallet and other EVM browser wallets all work. The first time you connect, your wallet is asked to add QMS Testnet (chain ID 19480) or switch to it.',
        'Some actions ask you to sign in. That is a text message you sign to show the wallet is yours. It is free and it cannot move anything.',
      ] },
      { q: 'Where do I get QMS to pay for gas?', a: [
        'From the QMS Testnet faucet at faucet.testnet.qms.finance. Each request sends 10 test QMS, and you can ask up to four times in 24 hours. Test QMS costs nothing and is worth nothing.',
      ] },
      { q: 'What does a sale cost?', a: [
        'The buyer pays the listed price and the network gas, nothing more. Out of that price the marketplace takes its fee ({market}) and the creator receives the royalty they set (10% at most). The seller gets the rest in the same transaction.',
        'Two limits are built into the contract: the marketplace fee can never be above 10%, and a listing is never charged a higher fee than the one in force when the seller signed it.',
      ] },
      { q: 'How do I put an NFT up for sale?', a: [
        'Open the item, choose List, set a price and how long the listing should last. The first listing in a collection needs one small approval transaction. Every listing after that is a signature: no gas, and your wallet shows the item, the price and the end date before you sign.',
        'You can list up to 50 items with one signature. Go to your profile or the collection, press Select, tick the items and choose List.',
      ] },
      { q: 'Can I buy more than one item in a single transaction?', a: [
        'Yes. Sweep lets you buy up to 25 listings at once, cheapest first. If one of them is sold or cancelled a moment before your transaction lands, it is skipped and the QMS for it comes straight back to you.',
        'A single Buy works the same way for one item: the NFT and every payout move together, or nothing moves. If someone was faster, you lose only the gas.',
      ] },
      { q: 'What is WQMS, and why are offers made in it?', a: [
        'WQMS is QMS in wrapped form: 1 WQMS is always 1 QMS, and you can change one into the other at any time. An offer has to stay in your wallet until somebody accepts it, and only a token like WQMS allows that. If you are short, Quantly offers to wrap the missing amount when you make the offer.',
        'You can bid on one item or on a whole collection; a collection offer is accepted with any item from it. If your WQMS balance or your allowance drops below the offer, the offer is shown as inactive until you top it up.',
      ] },
      { q: 'How do I take back a listing or an offer?', a: [
        'Cancel it on the item page or in your profile. Cancelling is a real transaction with a little gas, because that is what makes the old signature unusable for good. "Cancel everything" on the Security page does the same for every listing and offer you have signed, in one transaction.',
        'If you send the NFT to another wallet without cancelling, the listing cannot be filled while the NFT is away, but it comes back to life if the NFT returns to you before the listing expires. Cancel first if you do not want that.',
      ] },
      { q: 'I just minted or bought something. Why can\'t I see it yet?', a: [
        'The site shows a mint or a sale once it is a couple of blocks deep, and a QMS block takes about 10 seconds. Artwork is loaded from IPFS, which can be slow the first time, so give it a minute and reload the page.',
        'If the image still does not appear, the collection\'s metadata is probably wrong. Tell the creator, or send us a ticket from the Support page.',
      ] },
      { q: 'How is rarity worked out, and what do the ticks mean?', a: [
        'Each trait is scored by how few items in the collection have it, and the scores are added up. Rank #1 is the rarest item.',
        'A purple tick means the Quantly team has checked the collection. The gold tick is reserved for Quantly\'s own official collection.',
      ] },
    ],
  },
  {
    id: 'launchpad',
    title: 'Launchpad',
    intro: 'Publishing your own collection: artwork, mint phases and getting paid.',
    items: [
      { q: 'What does the launchpad do for me?', a: [
        'It creates an ERC-721 collection contract on QMS that belongs to your wallet, with no code to write. Quantly does not keep your artwork and does not hold your money. From the first mint on, the collection can be traded on the marketplace.',
      ] },
      { q: 'What should I have ready before I launch?', a: [
        'A wallet with a little QMS for gas, an X account, a link to your logo (a banner is optional), and your artwork: either one placeholder image, or an IPFS folder with the finished metadata. Launching costs network gas and nothing else.',
      ] },
      { q: 'Why must a creator link an X account?', a: [
        'So collectors can see that a real X account stands behind the collection. A link typed into a form can be faked; a connected account cannot. Quantly reads your @username once and that is all. It cannot post, it does not read your timeline or your followers, and it hands the access back to X straight away.',
      ] },
      { q: 'Where do the logo, banner and placeholder image come from?', a: [
        'From a link you paste. Put the file on IPFS (Pinata, for example) or on any https host. Good sizes are 400 × 400 for the logo, 1500 × 500 for the banner and 1000 × 1000 for the placeholder. PNG, JPG, GIF and WebP are accepted.',
        'For the placeholder you may also paste a link to a metadata file: a JSON with "name", "description" and "image".',
      ] },
      { q: 'What is the difference between the placeholder and the reveal?', a: [
        'Until you reveal, every token shows the same placeholder. When the real artwork is ready, upload the metadata folder to IPFS and press Reveal in the Studio. It is one transaction, and from then on wallets and marketplaces show each token\'s own artwork.',
      ] },
      { q: 'How should the metadata folder be laid out?', a: [
        'One JSON file for each token, named by its number: 1.json, 2.json and so on up to your supply. Every file needs "name", "description", "image" (a path into your images folder, such as ipfs://<images CID>/1.png) and "attributes" for the traits.',
        'Paste the folder link with a slash at the end: ipfs://<metadata CID>/. Before you deploy, Quantly opens tokens 1, 2, 3 and the last one, so you see what collectors will see.',
      ] },
      { q: 'How do allowlist and public phases work?', a: [
        'A mint is a list of phases, for example GTD, Allowlist and Public. Each one has its own start, end, price and per-wallet limit. An allowlist phase only lets in the wallets you add, and the contract checks that itself with a Merkle proof. The last phase is always public.',
      ] },
      { q: 'What can I still change once people are minting?', a: [
        'In the Studio you can move phase times, change prices and limits, pause the mint, lower the maximum supply (it can never go up), reveal, and freeze the metadata permanently. Anything you change after minting has started is shown to collectors on the mint page.',
      ] },
      { q: 'When does the mint money reach me?', a: [
        'At every mint, the platform fee ({mint}) goes to Quantly and the rest stays in your collection contract. Use Withdraw in the Studio whenever you like and it is sent to your payout wallet.',
        'Royalties are separate: on each marketplace sale your royalty (10% at most) is paid to your royalty wallet in the same transaction as the sale.',
      ] },
      { q: 'How do I get the verified tick?', a: [
        'Send a ticket from the Support page using your creator wallet. The team looks for a real team, a connected X account and metadata that loads correctly.',
      ] },
    ],
  },
  {
    id: 'safety',
    title: 'Wallet safety',
    intro: 'What Quantly can and cannot do with your wallet, and what to watch for.',
    items: [
      { q: 'What am I allowing when I approve the marketplace?', a: [
        'You allow the marketplace contract to move an NFT of that collection in two cases only: you signed a listing for that exact item at that exact price and someone pays it, or you accept an offer yourself. Nothing else can use the approval.',
        'The Security page lists every approval you have given and lets you remove any of them.',
      ] },
      { q: 'Can Quantly take my NFTs or my coins?', a: [
        'No. The contracts have no owner function that touches a user\'s NFTs or coins, and they cannot be swapped for new code. For offers, the site asks your wallet to allow the exact amount of the offer, never an unlimited amount.',
      ] },
      { q: 'Which requests should I refuse?', a: [
        'Anything that asks for your seed phrase or private key: Quantly never does. Check the address bar before you sign, and use only the official Quantly site.',
        'A real listing or offer shows the collection, the item and the price in your wallet. Reject a request that shows only an unreadable code, and reject "setApprovalForAll" on any site you do not know.',
      ] },
      { q: 'What do I do if someone may have my keys?', a: [
        'Act in this order. From a device you trust, move what you can to a new wallet. On the Security page, remove your approvals and press "Cancel everything", so no old listing or offer can be used. Then write to us from the Support page.',
      ] },
    ],
  },
];

export const faqGroups = (_lang: Lang, fees: { market?: number | null; mint?: number | null }): FaqGroup[] => {
  const pct = (bps?: number | null, fallback = '') => (bps === null || bps === undefined ? fallback : `${bps / 100}%`);
  const rate = 'current rate';
  const fill = (s: string) => s.split('{market}').join(pct(fees.market, rate)).split('{mint}').join(pct(fees.mint, rate));
  return EN.map((g) => ({ ...g, items: g.items.map((it) => ({ q: it.q, a: it.a.map(fill) })) }));
};
