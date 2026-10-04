// Guides shown beside the Create form: how to prepare a metadata folder (with downloadable examples),
// and how the pre-reveal placeholder works.
import { useI18n } from '../i18n';
import { download, makeZip } from '../lib/zip';
import { IconCheck, IconClose } from './Icons';

const EXAMPLE_CID = 'bafybeiexampleimagesfolderciddonotusethis1234567890abc';

type Meta = { name: string; description?: string; image: string; attributes?: { trait_type: string; value: string }[] };

function exampleMeta(id: number, name: string, description: string, cid = EXAMPLE_CID, ext = 'png'): Meta {
  const traits = [
    ['Background', ['Blue', 'Cream', 'Navy'][(id - 1) % 3]],
    ['Eyes', ['Laser', 'Sleepy', 'Normal'][(id - 1) % 3]],
    ['Mouth', ['Smile', 'Open', 'Smile'][(id - 1) % 3]],
  ];
  return {
    name: `${name || 'My Collection'} #${id}`,
    description: description || 'Describe your collection here.',
    image: `ipfs://${cid}/${id}.${ext}`,
    attributes: traits.map(([trait_type, value]) => ({ trait_type, value })),
  };
}

const json = (m: unknown) => `${JSON.stringify(m, null, 2)}\n`;

const README_EN = (supply: number) => `Quantly - metadata starter kit
===============================

Your collection needs TWO folders on IPFS (for example Pinata):

1) IMAGES FOLDER
   Put every image in one folder, named by token number, all with the same extension:
       images/1.png  images/2.png  images/3.png  ...  images/${supply || 'N'}.png
   Pinata -> Add -> Folder -> choose the folder. Copy the folder CID (starts with "bafy" or "Qm").

2) METADATA FOLDER
   One JSON file per token, named 1.json, 2.json ... up to your supply (${supply || 'N'}).
   Use metadata/1.json in this kit as the template. The "image" line points INSIDE the images folder:
       "image": "ipfs://<IMAGES FOLDER CID>/1.png"
   Only .json files go in this folder. Upload it to Pinata as a folder and copy its CID.

3) ON QUANTLY
   Create -> Supply and art -> "I already have a metadata folder" and paste:
       ipfs://<METADATA FOLDER CID>/
   (with the "/" at the end). Quantly opens 1.json, 2.json, 3.json and your last token and shows
   what collectors will see before you deploy.

Common mistakes
 x  Uploading images one by one and writing ipfs://<that file's CID>/1.png
    (a single-file CID has nothing inside it, so the link does not open in wallets or marketplaces)
 x  Fewer JSON files than the max supply (the last tokens would have no image)
 x  Files named "1" instead of "1.json", or numbering that starts at 0
 x  Images or other files inside the metadata folder
`;

/** How to prepare the metadata folder, with a sample 1.json and a starter kit to download. */
export function MetadataGuide({ name, description, supply }: { name: string; description: string; supply: number }) {
  const { t } = useI18n();
  const example = exampleMeta(1, name, description);

  function downloadExample() {
    download(new Blob([json(example)], { type: 'application/json' }), '1.json');
  }
  function downloadKit() {
    const files = [
      { name: 'quantly-metadata-kit/README.txt', data: README_EN(supply) },
      ...Array.from({ length: 3 }, (_, i) => ({ name: `quantly-metadata-kit/metadata/${i + 1}.json`, data: json(exampleMeta(i + 1, name, description)) })),
    ];
    download(makeZip(files), 'quantly-metadata-kit.zip');
  }

  return (
    <section className="meta-guide">
      <header className="meta-guide__head">
        <span className="guide-badge">{t('guide.badge')}</span>
        <span className="strong">{t('mg.title')}</span>
        <span className="small soft">{t('mg.sub')}</span>
      </header>
      <div className="meta-guide__body">
        <ol className="meta-steps">
          <li>
            <span className="meta-steps__n">1</span>
            <div>
              <div className="strong">{t('mg.s1')}</div>
              <div className="small soft">{t('mg.s1Body')}</div>
              <div className="tree"><span className="tree__dir">images/</span><span>1.png</span><span>2.png</span><span>3.png</span><span className="muted">… {supply ? `${supply}.png` : 'N.png'}</span><span className="tree__arrow">→ {t('mg.imagesCid')}</span></div>
            </div>
          </li>
          <li>
            <span className="meta-steps__n">2</span>
            <div>
              <div className="strong">{t('mg.s2')}</div>
              <div className="small soft">{t('mg.s2Body', { n: supply || 'N' })}</div>
              <div className="tree"><span className="tree__dir">metadata/</span><span>1.json</span><span>2.json</span><span>3.json</span><span className="muted">… {supply ? `${supply}.json` : 'N.json'}</span><span className="tree__arrow">→ {t('mg.metaCid')}</span></div>
              <pre className="meta-code" aria-label="1.json">
                {json(example).trimEnd().split('\n').map((line, i) => (
                  <span key={i}>{line.includes('"image"') ? <mark className="is-key">{line}</mark> : line}{'\n'}</span>
                ))}
              </pre>
            </div>
          </li>
          <li>
            <span className="meta-steps__n">3</span>
            <div>
              <div className="strong">{t('mg.s3')}</div>
              <div className="small soft">{t('mg.s3Body')}</div>
              <code className="meta-inline">ipfs://&lt;{t('mg.metaCidShort')}&gt;/</code>
            </div>
          </li>
        </ol>
        <ul className="meta-rules">
          <li className="is-do"><IconCheck size={14} />{t('mg.r1', { n: supply || 'N' })}</li>
          <li className="is-do"><IconCheck size={14} />{t('mg.r2')}</li>
          <li className="is-do"><IconCheck size={14} />{t('mg.r5')}</li>
          <li className="is-dont"><IconClose size={14} />{t('mg.r3')}</li>
          <li className="is-dont"><IconClose size={14} />{t('mg.r4')}</li>
        </ul>
        <div className="row-wrap">
          <button type="button" className="btn btn--sm" onClick={downloadKit}>{t('mg.kit')}</button>
          <button type="button" className="btn btn--sm btn--outline" onClick={downloadExample}>{t('mg.example')}</button>
        </div>
      </div>
    </section>
  );
}

/** How the pre-reveal placeholder works and what to paste. */
export function PreRevealGuide({ name }: { name: string }) {
  const { t } = useI18n();
  const hidden = { name: `${name || 'My Collection'} (unrevealed)`, description: 'Revealing soon.', image: 'ipfs://bafy…/prereveal.png' };
  return (
    <section className="meta-guide">
      <header className="meta-guide__head">
        <span className="guide-badge">{t('guide.badge')}</span>
        <span className="strong">{t('pg.title')}</span>
        <span className="small soft">{t('pg.sub')}</span>
      </header>
      <div className="meta-guide__body">
        <ol className="meta-steps">
          <li>
            <span className="meta-steps__n">1</span>
            <div><div className="strong">{t('pg.s1')}</div><div className="small soft">{t('pg.s1Body')}</div></div>
          </li>
          <li>
            <span className="meta-steps__n">2</span>
            <div>
              <div className="strong">{t('pg.s2')}</div>
              <div className="small soft">{t('pg.s2Body')}</div>
              <pre className="meta-code" aria-label="hidden.json">
                {json(hidden).trimEnd().split('\n').map((line, i) => (
                  <span key={i}>{line.includes('"image"') ? <mark className="is-key">{line}</mark> : line}{'\n'}</span>
                ))}
              </pre>
            </div>
          </li>
          <li>
            <span className="meta-steps__n">3</span>
            <div><div className="strong">{t('pg.s3')}</div><div className="small soft">{t('pg.s3Body')}</div></div>
          </li>
        </ol>
        <ul className="meta-rules">
          <li className="is-do"><IconCheck size={14} />{t('pg.r1')}</li>
          <li className="is-do"><IconCheck size={14} />{t('pg.r2')}</li>
          <li className="is-dont"><IconClose size={14} />{t('pg.r3')}</li>
        </ul>
      </div>
    </section>
  );
}
