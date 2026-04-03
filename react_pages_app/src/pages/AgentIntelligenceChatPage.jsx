import { useEffect, useMemo, useState } from 'react';
import './AgentIntelligenceChatPage.css';

export const pageMeta = {
  slug: 'agent_intelligence_chat',
  path: '/agent_intelligence_chat',
  label: 'Agent Intelligence Chat',
  title: 'Axiom Intelligence Agent',
};

const avatarUrl =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDp3E0tGblzNd3IBPNE-jYmppEFn-nXHjTG1oOdXPAeR_jxaeEiFB7mzh70o3GFawCg7t-C5ZWXUaIS20AIR_5thTVlM5biEc-JP4heV9YyA13mygGIXjaScU8tF_BYDDfwK8tBW4Pp6h7kLQO9iLFJ0CHDSpQRlF1IabvihrjP2VtYKESUUTAS9dALJtrJrk3LWiie3XjjPGJlu2NNmuQQxWiGBM5jHoAmlRq9BBwF2vpM3hlFGfVEIT_D3yD-XEd_MCns_Zzkr2U';

const mapUrl =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBOP2uk8Nn3e9TpRpxeuaemm7b43VZimKelsYVdpSaazq4eg0WWXrbYgnm9TzsFPtS5hRmw1Z0SVTFfudGkhhwUPfastO0CICTauA-Rkb5ilJd_2mnHrEZfRbjZzniCWovH6J0M1umkjEOWo5w1x3yWLhQlWyKI4seDVXT1Q5GNp4rMcCCmrNZihsf0f7tCUALUodNeGgqKADXxZ10ZctsiB8pem5VBttiV77D-dW4vctRJGQDyCmEtGvvqeJD5lf14CYj57EXTjRA';

const properties = [
  {
    id: 'st-ursula',
    name: 'St. Ursula Street Townhouse',
    meta: '2 Bed | 110sqm | Reserve: EUR 380,000',
    reserve: 'EUR 380k',
    yield: '5.8%',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD2V5FcdDacGGrK82s1pbqwEJjuS-irBn_oAixXaY1WjQZXC5wIbN9jMVH9Q5AQ35IdhKrdnWwrxFaPL_iO717w36O_rRlAoBpwj5SWdavnYPeUQx6dK2pooRm3kDaxVMzeQ3pJdF6QHiSKwxxVRw1M3tASX7bEggSzcYyTvhNhHw0YVYSpbwL-Jp4-1CxjGvmM7algySUYGMpINfYiHmPsaenfw3QFVHymfEdK9sQIKYHN9zE7Tpe_CbDZ372WyGkJ2nCiWfpDR6w',
  },
  {
    id: 'upper-barrakka',
    name: 'Upper Barrakka Apartment',
    meta: '1 Bed | 65sqm | Reserve: EUR 295,000',
    reserve: 'EUR 295k',
    yield: '4.9%',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBP6LSvZgiErKjrYJi3_CCoZ859dvc4os-xoFNQm4ceYkIjLeZ2tp4bgQA0K373wnz6ZXWUf-N32EN5e7QSKbeitl67cVHeNf4bT7xQkUPOjMq9x53Gn00cBO33aagmnsoOjokXulG_I9TtE1DXhMhu0RXMDzQyWZKihtmcIG1UEO7MhbbTkUsCXq8130W3w8Z-iF1nmmrjUi3m36ks2-3AlmjW1u06rHt_mTGaI0zuSxPi_buE3bc7_CPQCm8aD-3gIB3WljDI-IQ',
  },
];

const citedUnits = [
  {
    id: 'ax-992',
    title: 'AX-992 Valletta',
    roi: 'Estimated ROI: 6.1%',
    status: 'In Review',
    tone: 'blue',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDK9hFsSLIMVm5T-8sZUretYzlX3WgLXZnniCQ4vEI7oWbqkbCvxcGglt1jzJeRmp6vJ__4ILTNxZCQx8a-omWoDRkPWXWs8eOpvwA3mK_0DNvHUxma0zpC50ttlc6EWkPVmO9BURtyQnzV1DDFFjDe8KF_vzeeS61Mjw9RM8NIqvJWf8GAVo15kNr3zHUarRd957_YFrq7SqTsu_IHrW4RB0LhpV7dELg-25e0oY5zoBZrzZLQVrvtgobW_gLGoweYGHE1WclC1Rs',
  },
  {
    id: 'fl-440',
    title: 'FL-440 Floriana',
    roi: 'Estimated ROI: 4.8%',
    status: 'Auction Live',
    tone: 'green',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDfaBLHyWRtjaKe1zuUOhb3oTKt5ZkkSULhUAvtJNHWU7Eebyx-9u7hVr4c59VebYuHqdbrlThY8rTwX4Hutt01KuLbCT27XHiBQ7hWnEnYHAZv66P0kaDRvLJKZEAiBmli1J0_RibWkkLqs2kEEA_uUF-Ld0GaUQCXgCBmfyH6HjxmoELmploRJ_hYMP77FW-hrWwvaoZiRkXUX07e20fWe-9GH5aAEY4R-erbxHXEcnfH8OzNnZd84uOMHGqkQo5S9WIqpwfT6xs',
  },
];

const sourcesUsed = [
  { id: 'pdf', icon: 'picture_as_pdf', title: 'Bank Auction PDF 2024', meta: 'Verified | 2m ago' },
  { id: 'gov', icon: 'language', title: 'Gov Portal Scraping', meta: 'Live Stream | 1h ago' },
];

const recentQueries = [
  'Sliema vs St Julians Rent Analysis',
  'Government Auction Summaries',
  'Bank Property Valuation - Gozo',
];

const suggestedPrompts = [
  'Latest auctions this week',
  'Compare average price by area',
  'Show new rent listings near me',
  'Summarize failed sources',
];

const toolActions = [
  { icon: 'domain', label: 'Asset Valuation' },
  { icon: 'description', label: 'Zoning Reports' },
  { icon: 'history', label: 'Archive' },
];

const starterPrompt =
  'Can you show me a summary of the latest property auctions in Valletta and Floriana? Focus on residential units and compare the estimated yields.';

function MaterialIcon({ children, filled = false }) {
  const style = filled ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" } : undefined;
  return (
    <span className="material-symbols-outlined" style={style} aria-hidden="true">
      {children}
    </span>
  );
}

function buildAssistantMessage(prompt, activeProperty) {
  return {
    id: `assistant-${Date.now()}`,
    role: 'assistant',
    content:
      prompt.includes('failed sources')
        ? 'I checked extraction telemetry across the monitored source pool. Two source groups are degrading due to pagination drift, while Valletta and Floriana auction feeds remain healthy with stable reserve-price extraction.'
        : `I analyzed the latest data from the Government Lands Authority and connected auction portals. ${activeProperty.name} remains the strongest lead in the current set, with reserve pricing at ${activeProperty.reserve} and an estimated yield of ${activeProperty.yield}.`,
  };
}

export default function AgentIntelligenceChatPage() {
  const [composer, setComposer] = useState(starterPrompt);
  const [activePropertyId, setActivePropertyId] = useState(properties[0].id);
  const [activeQuery, setActiveQuery] = useState(recentQueries[1]);
  const [messages, setMessages] = useState([
    { id: 'user-1', role: 'user', content: starterPrompt },
    buildAssistantMessage(starterPrompt, properties[0]),
  ]);

  useEffect(() => {
    const previousTitle = document.title;
    const previousHtmlClass = document.documentElement.className;
    const previousBodyClass = document.body.className;

    document.title = pageMeta.title;
    document.documentElement.className = 'light';
    document.body.className = 'bg-background text-on-background font-body';

    return () => {
      document.title = previousTitle;
      document.documentElement.className = previousHtmlClass;
      document.body.className = previousBodyClass;
    };
  }, []);

  const activeProperty = useMemo(
    () => properties.find((property) => property.id === activePropertyId) ?? properties[0],
    [activePropertyId],
  );

  function submitPrompt(promptText) {
    const trimmed = promptText.trim();
    if (!trimmed) {
      return;
    }

    const nextMessages = [
      ...messages,
      { id: `user-${Date.now()}`, role: 'user', content: trimmed },
      buildAssistantMessage(trimmed, activeProperty),
    ];

    setMessages(nextMessages);
    setComposer('');
  }

  function handleComposerSubmit(event) {
    event.preventDefault();
    submitPrompt(composer);
  }

  return (
    <div className="agent-chat-page">
      <header className="agent-chat-page__topbar">
        <div className="agent-chat-page__brand">
          <h1 className="agent-chat-page__brand-title">Axiom</h1>
          <nav className="agent-chat-page__nav" aria-label="Top navigation">
            <a className="agent-chat-page__nav-link" href="#/axiom_main_dashboard">
              Portfolio
            </a>
            <a className="agent-chat-page__nav-link" href="#/axiom_map_explorer">
              Markets
            </a>
            <a className="agent-chat-page__nav-link agent-chat-page__nav-link--active" href="#/agent_intelligence_chat">
              Analytics
            </a>
          </nav>
        </div>

        <div className="agent-chat-page__topbar-actions">
          <label className="agent-chat-page__search">
            <MaterialIcon>search</MaterialIcon>
            <input type="text" placeholder="Search data points..." />
          </label>
          <button className="agent-chat-page__icon-button" type="button" aria-label="Notifications">
            <MaterialIcon>notifications</MaterialIcon>
          </button>
          <button className="agent-chat-page__icon-button" type="button" aria-label="Settings">
            <MaterialIcon>settings</MaterialIcon>
          </button>
          <img className="agent-chat-page__avatar" src={avatarUrl} alt="User profile avatar" />
        </div>
      </header>

      <div className="agent-chat-page__layout">
        <aside className="agent-chat-page__sidebar">
          <div className="agent-chat-page__assistant-brand">
            <div className="agent-chat-page__assistant-icon">
              <MaterialIcon filled>architecture</MaterialIcon>
            </div>
            <div>
              <p className="agent-chat-page__assistant-title">Axiom AI</p>
              <p className="agent-chat-page__assistant-subtitle">Institutional Grade</p>
            </div>
          </div>

          <button className="agent-chat-page__primary-button" type="button" onClick={() => setMessages([])}>
            <MaterialIcon>add_comment</MaterialIcon>
            New Chat
          </button>

          <div className="agent-chat-page__sidebar-scroll">
            <p className="agent-chat-page__sidebar-section-title">Recent Queries</p>
            {recentQueries.map((query) => (
              <button
                key={query}
                className={`agent-chat-page__query-button ${activeQuery === query ? 'agent-chat-page__query-button--active' : ''}`.trim()}
                type="button"
                onClick={() => {
                  setActiveQuery(query);
                  setComposer(query);
                }}
              >
                {query}
              </button>
            ))}

            <div className="agent-chat-page__tool-list">
              {toolActions.map((tool) => (
                <button key={tool.label} className="agent-chat-page__tool-button" type="button">
                  <MaterialIcon>{tool.icon}</MaterialIcon>
                  <span>{tool.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="agent-chat-page__sidebar-footer">
            <button className="agent-chat-page__upgrade" type="button">
              Upgrade to Pro
            </button>
            <button className="agent-chat-page__ghost-button" type="button">
              <MaterialIcon>help</MaterialIcon>
              <span>Help Center</span>
            </button>
            <button className="agent-chat-page__ghost-button" type="button">
              <MaterialIcon>account_circle</MaterialIcon>
              <span>Account</span>
            </button>
          </div>
        </aside>

        <section className="agent-chat-page__chat">
          <header className="agent-chat-page__chat-header">
            <div>
              <h2 className="agent-chat-page__chat-title">Axiom Intelligence Agent</h2>
              <div className="agent-chat-page__status">
                <span className="agent-chat-page__status-dot" />
                <span>Institutional Grade AI Active</span>
              </div>
            </div>
            <div>
              <button className="agent-chat-page__icon-button" type="button" aria-label="Share">
                <MaterialIcon>share</MaterialIcon>
              </button>
              <button className="agent-chat-page__icon-button" type="button" aria-label="More">
                <MaterialIcon>more_vert</MaterialIcon>
              </button>
            </div>
          </header>

          <div className="agent-chat-page__feed">
            <div className="agent-chat-page__messages">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`agent-chat-page__message ${
                    message.role === 'user' ? 'agent-chat-page__message--user' : 'agent-chat-page__message--assistant'
                  }`.trim()}
                >
                  {message.role === 'user' ? (
                    <div className="agent-chat-page__bubble">
                      <p>{message.content}</p>
                    </div>
                  ) : (
                    <div className="agent-chat-page__bubble">
                      <div className="agent-chat-page__assistant-badge">
                        <MaterialIcon filled>hub</MaterialIcon>
                      </div>
                      <div className="agent-chat-page__assistant-content">
                        <div className="agent-chat-page__assistant-text">
                          <p>{message.content}</p>
                          {index === 1 || index === messages.length - 1 ? (
                            <>
                              <div className="agent-chat-page__metric-grid">
                                <div className="agent-chat-page__metric-card agent-chat-page__metric-card--yield">
                                  <p className="agent-chat-page__metric-label">Average Yield</p>
                                  <p className="agent-chat-page__metric-value">
                                    5.2% <span className="agent-chat-page__metric-delta">+0.4%</span>
                                  </p>
                                </div>
                                <div className="agent-chat-page__metric-card">
                                  <p className="agent-chat-page__metric-label">Median Reserve</p>
                                  <p className="agent-chat-page__metric-value">EUR 425k</p>
                                </div>
                              </div>

                              <div className="agent-chat-page__hotlist">
                                <div className="agent-chat-page__hotlist-header">
                                  <p className="agent-chat-page__hotlist-title">Valletta Auction Hotlist</p>
                                  <span className="agent-chat-page__pill agent-chat-page__pill--green">
                                    4 Units Matching
                                  </span>
                                </div>
                                <div className="agent-chat-page__hotlist-body">
                                  {properties.map((property) => (
                                    <button
                                      key={property.id}
                                      className={`agent-chat-page__property-row ${
                                        property.id === activeProperty.id ? 'agent-chat-page__property-row--active' : ''
                                      }`.trim()}
                                      type="button"
                                      onClick={() => setActivePropertyId(property.id)}
                                    >
                                      <img className="agent-chat-page__property-thumb" src={property.image} alt={property.name} />
                                      <div>
                                        <p className="agent-chat-page__property-name">{property.name}</p>
                                        <p className="agent-chat-page__property-meta">{property.meta}</p>
                                      </div>
                                      <span className="agent-chat-page__property-arrow">
                                        <MaterialIcon>arrow_forward_ios</MaterialIcon>
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="agent-chat-page__action-row">
                                <button className="agent-chat-page__action agent-chat-page__action--primary" type="button">
                                  <MaterialIcon>download</MaterialIcon>
                                  Export Summary
                                </button>
                                <button className="agent-chat-page__action agent-chat-page__action--secondary" type="button">
                                  <MaterialIcon>push_pin</MaterialIcon>
                                  Pin Insight
                                </button>
                              </div>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <div className="agent-chat-page__prompt-group">
                <p className="agent-chat-page__prompt-label">Suggested Analysis</p>
                <div className="agent-chat-page__prompt-list">
                  {suggestedPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      className="agent-chat-page__prompt-chip"
                      type="button"
                      onClick={() => setComposer(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <form className="agent-chat-page__composer" onSubmit={handleComposerSubmit}>
            <div className="agent-chat-page__composer-filters">
              <button className="agent-chat-page__composer-filter" type="button">
                <MaterialIcon>database</MaterialIcon>
                <span>Sources: All Platforms</span>
              </button>
              <button className="agent-chat-page__composer-filter" type="button">
                <MaterialIcon>filter_alt</MaterialIcon>
                <span>Type: Residential</span>
              </button>
            </div>
            <div className="agent-chat-page__composer-box">
              <button className="agent-chat-page__icon-button" type="button" aria-label="Attach file">
                <MaterialIcon>attach_file</MaterialIcon>
              </button>
              <textarea
                value={composer}
                onChange={(event) => setComposer(event.target.value)}
                placeholder="Ask Axiom anything about the market..."
                rows={2}
              />
              <button className="agent-chat-page__icon-button" type="button" aria-label="Voice input">
                <MaterialIcon>mic</MaterialIcon>
              </button>
              <button className="agent-chat-page__send" type="submit" disabled={!composer.trim()}>
                <MaterialIcon>send</MaterialIcon>
              </button>
            </div>
          </form>
        </section>

        <aside className="agent-chat-page__insights">
          <div className="agent-chat-page__insights-scroll">
            <section className="agent-chat-page__insight-section">
              <p className="agent-chat-page__insight-title">Sources Used</p>
              {sourcesUsed.map((source) => (
                <div key={source.id} className="agent-chat-page__source-card">
                  <MaterialIcon>{source.icon}</MaterialIcon>
                  <div>
                    <p className="agent-chat-page__citation-name">{source.title}</p>
                    <p className="agent-chat-page__citation-meta">{source.meta}</p>
                  </div>
                </div>
              ))}
            </section>

            <section className="agent-chat-page__insight-section">
              <p className="agent-chat-page__insight-title">Market Context</p>
              <div className="agent-chat-page__map">
                <img src={mapUrl} alt="Property map context" />
                <div className="agent-chat-page__map-marker">
                  <span className="agent-chat-page__map-dot" />
                </div>
                <div className="agent-chat-page__map-badge">Valletta Cluster Analysis</div>
              </div>
            </section>

            <section className="agent-chat-page__insight-section">
              <p className="agent-chat-page__insight-title">Cited Units</p>
              {citedUnits.map((unit) => (
                <div key={unit.id} className="agent-chat-page__citation">
                  <img className="agent-chat-page__citation-thumb" src={unit.image} alt={unit.title} />
                  <div>
                    <p className="agent-chat-page__citation-name">{unit.title}</p>
                    <p className="agent-chat-page__citation-meta">{unit.roi}</p>
                    <span
                      className={`agent-chat-page__pill ${
                        unit.tone === 'green' ? 'agent-chat-page__pill--green' : 'agent-chat-page__pill--blue'
                      }`.trim()}
                    >
                      {unit.status}
                    </span>
                  </div>
                </div>
              ))}
            </section>
          </div>

          <div className="agent-chat-page__insights-footer">
            <div className="agent-chat-page__latency-row">
              <p className="agent-chat-page__latency-label">Processing Latency</p>
              <p className="agent-chat-page__latency-value">420ms</p>
            </div>
            <div className="agent-chat-page__latency-track">
              <div className="agent-chat-page__latency-fill" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
