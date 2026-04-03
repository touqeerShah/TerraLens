import { useEffect, useMemo, useState } from 'react';
import './DeduplicationMergeCenterPage.css';

export const pageMeta = {
  slug: 'deduplication_merge_center',
  path: '/deduplication_merge_center',
  label: 'Deduplication Merge Center',
  title: 'Merge Center | The Architectural Intelligence',
};

const duplicatePairs = [
  {
    id: 'ridge-heights',
    similarity: 98.4,
    contact: 'Julian Sterling',
    left: {
      name: '882 High Ridge Heights',
      location: 'Beverly Hills, CA 90210',
      valuation: '$4,850,000',
      architecture: 'Modernist',
      sqft: '5,240 sqft',
      lot: '0.42 Acres',
      sold: 'Oct 2021',
      taxId: '438-202-09',
      source: 'MLS Primary',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCs6irAIgJYM2x8IEMLKs2mcyCBYd6hI0oW96eDp2MvMBpaiszgAn5GZt9m-5waCxYwAh45o7y-Njhfv7habFTl4Xky10BC6kCYZaZ_eaapwgAbnDzl1tFdBlRU3953b3sY5VUFwsevCEADeVafbS-7uF0Tt-HpB4NkDJDxzDpnWJZCnKRFFMfXLY3jOb8TDNLhT7-jhfAV---ZAEIiUS1wC7Uqa1e0E-kihs-vOx2Cblwnq-bIHpbPk3gNjwVgvkJvWDZW4_QAux8',
    },
    right: {
      name: '882 Highridge Hts',
      location: 'Beverly Hills, California 90210',
      valuation: '$4,852,100',
      architecture: 'Contemporary',
      sqft: '5,255 sqft',
      lot: '0.42 Acres',
      sold: 'Oct 2021',
      taxId: '43820209',
      source: 'County Records',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAyuaaZfANjDFCw3fTaRC8xWud4X1zyAn9Vzty8fS1uCrOnTFTKnktPN1b-PkVphaRpGV9DyD_2JW8N995vroT2oCFqt1quWNoA3n1uC8N5L7ybClGBpg5GhkVpyUQPatPDp0kgIQoBgnULJyGp1vEYXg6WM6Y848RkzmX-hAx3VpZJzprz6pcEx-OlXEv-N_u3otplRmYAZvs4e3VHAiIVBhWqEDoQd0t7795oOa73iBLKtG6bD73-jU18N89CkZz04EZs2J7hpj4',
    },
    conflicts: ['Sqft mismatch', 'Architecture label'],
  },
  {
    id: 'oakwood',
    similarity: 94.1,
    contact: 'Marla Sutton',
    left: {
      name: '1200 Oakwood Blvd',
      location: 'Bel Air, CA',
      valuation: '$7,210,000',
      architecture: 'Spanish Revival',
      sqft: '6,010 sqft',
      lot: '0.63 Acres',
      sold: 'Jan 2022',
      taxId: '192-110-82',
      source: 'Broker Feed',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuD5ZKEfpa5GGVAVDcexvoyFlhHisG0DlZOehXqpIcppGD-Qa6_hBZiop4ec0aNd97rbMKBX_CftD_RgvGxunJHDi24sYTyv0Ia2gim_qS_LtLdHPzoul4RPazSGs3uoUXYikR9-4J1dGHhwQbXPkCO1s-UvRwWGkK8oC4sYkg0SYifUiGzXd0_mDOcOUXA59Uiyfb8ZjxpVK99OTmlq94Kq7M4u35OQxYojCZxUhZhFNg0QtvLjFgKL_HNzmNeNBB8yCsWe-rdbkhU',
    },
    right: {
      name: 'Oakwood Boulevard Estate',
      location: 'Bel Air, California',
      valuation: '$7,180,000',
      architecture: 'Spanish Revival',
      sqft: '6,040 sqft',
      lot: '0.63 Acres',
      sold: 'Jan 2022',
      taxId: '19211082',
      source: 'Title Archive',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCwocsFaeQ5-dpmmSDruStKUoSwEuECN1q-vp_ZaXOZ2c9LXC9U3DOOdzdwZR4yAMdJTL8Rppxgorl0oN58u8RkmABszLfpVfylxCgB_MrXwa5OtbnaSZZJ1k0NbPSmyEZgPMkPz4hVBW0eiwTnAErbUvgOPO9hvBguBbnXBscmacQ9YROgStguRL3KGqr83vRTZTY_xOOTKAJlNxWAdJtB2e7ewvSB3cRpcB_ftatDBI-sdOZaQ4ZM1CCJOnoY_2WVsRP8PvYn6Q0',
    },
    conflicts: ['Address format', 'Sqft mismatch'],
  },
  {
    id: 'skyloft',
    similarity: 91.2,
    contact: 'Ridge Capital',
    left: {
      name: 'Skyloft Penthouse',
      location: 'Downtown LA',
      valuation: '$3,850,000',
      architecture: 'Contemporary',
      sqft: '2,880 sqft',
      lot: 'N/A',
      sold: 'Sep 2023',
      taxId: '800-102-45',
      source: 'Internal CRM',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBHzeFCutRfXgCVC33KWq6novnRTr6rQLRcLjokGC5o3fZpxK8aMDMOi1zsKgtJ4L2QH5M0twDbEShhTf2pEVlQSvTeLytNR0Dd1hSOV7H5USEtnDn8YlX56oc0T_t7I1McmmiSWucFx2Ql2ir2ZGJPWPYahOaA7b5nKhyCPGQsplROthpis4SS_oapznWHkFRSQNI-MJLCBqKcJv80HLaA7rsrrEO9FkNfWjjZLNNrd3qyk6cwzHd1XmmfL6mKfkQZ1z2c5-Z6-5g',
    },
    right: {
      name: 'The Skyloft Penthouse',
      location: 'Los Angeles, CA',
      valuation: '$3,860,000',
      architecture: 'Contemporary',
      sqft: '2,880 sqft',
      lot: 'N/A',
      sold: 'Sep 2023',
      taxId: '80010245',
      source: 'Owner Record',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBeOYCAei29ioCQa52yC67IJyJbZrqm_cv5g0iO2MPEN-Qq1DzVCAc6dap_POaNQgWiiWDlz150K-7vdRsSfbmss35LIiUqkarrNOn28pPbzI_HNgHxoq8jpXmlDxCDshwqKCWHLIkJkeOjZ5_Y2htLf8crQYs4v3g6KWJAUnPTHW9sW3wge1Ftwr8tvtt9RsaTC1qsBWVbl6l_PQFvim22q3k_cjmEIxjUbcjT2wWnTu8XslTA5tzMLEy2OQeAbFyNnklEPzMo-wc',
    },
    conflicts: ['Name normalization'],
  },
];

function MaterialIcon({ children, className = '' }) {
  return <span className={`material-symbols-outlined ${className}`.trim()}>{children}</span>;
}

export default function DeduplicationMergeCenterPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [masterSide, setMasterSide] = useState('left');
  const [lastAction, setLastAction] = useState('Awaiting review');

  useEffect(() => {
    const previousTitle = document.title;
    const previousHtmlClass = document.documentElement.className;
    const previousBodyClass = document.body.className;

    document.title = pageMeta.title;
    document.documentElement.className = 'light';
    document.body.className = 'bg-surface text-on-surface';

    return () => {
      document.title = previousTitle;
      document.documentElement.className = previousHtmlClass;
      document.body.className = previousBodyClass;
    };
  }, []);

  const currentPair = duplicatePairs[currentIndex];
  const remainingCount = duplicatePairs.length - currentIndex - 1;
  const masterRecord = currentPair[masterSide];

  function cycleDecision(action) {
    setLastAction(`${action} for ${currentPair.left.name}`);
    setCurrentIndex((index) => (index + 1) % duplicatePairs.length);
  }

  const queue = useMemo(
    () => duplicatePairs.map((pair) => ({ id: pair.id, label: pair.left.name, similarity: pair.similarity })),
    [],
  );

  return (
    <div className="merge-page">
      <aside className="merge-page__sidebar">
        <div>
          <div className="merge-page__brand">
            <h1>Property Intel</h1>
            <p>Architectural Intelligence</p>
          </div>

          <nav className="merge-page__nav">
            <a href="#/axiom_main_dashboard">Overview</a>
            <a href="#/document_intelligence_analysis">Data Repair</a>
            <a href="#/deduplication_merge_center" data-active="true">
              Merge Center
            </a>
            <a href="#/workspace_team_settings">Watchlists</a>
            <a href="#/axiom_analytics_market_trends">Insights</a>
          </nav>
        </div>

        <button type="button" className="merge-page__new-button">
          <MaterialIcon>add</MaterialIcon>
          New Analysis
        </button>
      </aside>

      <div className="merge-page__main">
        <header className="merge-page__topbar">
          <label className="merge-page__search">
            <MaterialIcon>search</MaterialIcon>
            <input type="text" placeholder="Search duplicates..." />
          </label>

          <div className="merge-page__topbar-actions">
            <button type="button" className="merge-page__topbar-button">
              Run Report
            </button>
            <button type="button" className="merge-page__icon-button" aria-label="Notifications">
              <MaterialIcon>notifications</MaterialIcon>
            </button>
          </div>
        </header>

        <main className="merge-page__content">
          <section className="merge-page__hero">
            <div>
              <p className="merge-page__eyebrow">Quality Control</p>
              <h2>Reviewing Duplicates</h2>
              <p>
                Our intelligence engine identified high-confidence duplicate pairs. Resolve these
                entries to maintain architectural integrity.
              </p>
            </div>

            <div className="merge-page__score-card">
              <span>Similarity Match</span>
              <strong>{currentPair.similarity.toFixed(1)}%</strong>
              <small>{lastAction}</small>
            </div>
          </section>

          <section className="merge-page__comparison">
            {['left', 'right'].map((side) => {
              const record = currentPair[side];

              return (
                <article
                  key={side}
                  className={`merge-page__candidate ${
                    masterSide === side ? 'merge-page__candidate--master' : ''
                  }`.trim()}
                >
                  <img src={record.image} alt={record.name} className="merge-page__candidate-image" />
                  <div className="merge-page__candidate-body">
                    <div className="merge-page__candidate-headline">
                      <div>
                        <span className="merge-page__source-tag">Source: {record.source}</span>
                        <h3>{record.name}</h3>
                        <p>{record.location}</p>
                      </div>

                      <button
                        type="button"
                        className="merge-page__select-master"
                        data-active={masterSide === side}
                        onClick={() => setMasterSide(side)}
                      >
                        {masterSide === side ? 'Master Record' : 'Set as Master'}
                      </button>
                    </div>

                    <dl className="merge-page__facts">
                      <div>
                        <dt>Valuation</dt>
                        <dd>{record.valuation}</dd>
                      </div>
                      <div>
                        <dt>Architecture</dt>
                        <dd>{record.architecture}</dd>
                      </div>
                      <div>
                        <dt>Square Footage</dt>
                        <dd>{record.sqft}</dd>
                      </div>
                      <div>
                        <dt>Lot Size</dt>
                        <dd>{record.lot}</dd>
                      </div>
                      <div>
                        <dt>Last Sold</dt>
                        <dd>{record.sold}</dd>
                      </div>
                      <div>
                        <dt>Tax ID</dt>
                        <dd>{record.taxId}</dd>
                      </div>
                    </dl>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="merge-page__decision-band">
            <div className="merge-page__decision-summary">
              <div>
                <p className="merge-page__eyebrow">Conflict Summary</p>
                <h3>{masterRecord.name}</h3>
              </div>
              <div className="merge-page__conflicts">
                {currentPair.conflicts.map((conflict) => (
                  <span key={conflict}>{conflict}</span>
                ))}
              </div>
            </div>

            <p className="merge-page__contact-note">
              Both sources refer to owner <strong>{currentPair.contact}</strong>.
            </p>

            <div className="merge-page__action-row">
              <button type="button" className="merge-page__ghost-button" onClick={() => cycleDecision('Marked false duplicate')}>
                Mark False Duplicate
              </button>
              <button type="button" className="merge-page__ghost-button" onClick={() => cycleDecision('Kept records separate')}>
                Keep Separate
              </button>
              <button type="button" className="merge-page__primary-button" onClick={() => cycleDecision('Confirmed merge')}>
                <MaterialIcon>auto_awesome_motion</MaterialIcon>
                Confirm &amp; Merge
              </button>
            </div>
          </section>

          <section className="merge-page__queue">
            <div className="merge-page__queue-header">
              <div>
                <p className="merge-page__eyebrow">Review Queue</p>
                <h3>{remainingCount} Remaining</h3>
              </div>
              <div className="merge-page__queue-controls">
                <button type="button" onClick={() => setCurrentIndex((index) => (index - 1 + duplicatePairs.length) % duplicatePairs.length)}>
                  <MaterialIcon>chevron_left</MaterialIcon>
                </button>
                <button type="button" onClick={() => setCurrentIndex((index) => (index + 1) % duplicatePairs.length)}>
                  <MaterialIcon>chevron_right</MaterialIcon>
                </button>
              </div>
            </div>

            <div className="merge-page__queue-grid">
              {queue.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  className="merge-page__queue-card"
                  data-active={index === currentIndex}
                  onClick={() => setCurrentIndex(index)}
                >
                  <span>{item.similarity.toFixed(0)}% Match</span>
                  <strong>{item.label}</strong>
                </button>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
