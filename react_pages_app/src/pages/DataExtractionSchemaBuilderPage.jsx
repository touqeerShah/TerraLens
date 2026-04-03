import { useEffect, useMemo, useState } from 'react';
import './DataExtractionSchemaBuilderPage.css';

export const pageMeta = {
  slug: 'data_extraction_schema_builder',
  path: '/data_extraction_schema_builder',
  label: 'Data Extraction Schema Builder',
  title: 'Axiom | Extraction Schema Builder',
};

const categories = [
  { id: 'residential', label: 'Residential', icon: 'domain' },
  { id: 'commercial', label: 'Commercial', icon: 'business' },
  { id: 'industrial', label: 'Industrial', icon: 'factory' },
];

const variants = ['SALE', 'RENT', 'AUCTION'];

const defaultFields = [
  {
    id: 'title',
    name: 'Property Title',
    key: 'asset_title_primary',
    type: 'String',
    validation: 'MaxLength(150), NoEmoji',
    required: true,
  },
  {
    id: 'valuation',
    name: 'Valuation / Price',
    key: 'valuation_curr',
    type: 'Number',
    validation: 'Currency("GBP"), Min(0)',
    required: true,
  },
  {
    id: 'coordinates',
    name: 'Location Geo-JSON',
    key: 'coordinates_point',
    type: 'Object',
    validation: 'Format("LatLng")',
    required: false,
  },
  {
    id: 'floor-plan',
    name: 'Floor Plan PDF',
    key: 'floor_plan_document',
    type: 'PDF',
    validation: 'MaxFile(10MB), OCR-Ready',
    required: false,
  },
];

function MaterialIcon({ children, className = '' }) {
  return <span className={`material-symbols-outlined ${className}`.trim()}>{children}</span>;
}

export default function DataExtractionSchemaBuilderPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('residential');
  const [activeVariant, setActiveVariant] = useState('SALE');
  const [fields, setFields] = useState(defaultFields);
  const [selectedFieldId, setSelectedFieldId] = useState(defaultFields[0].id);
  const [saveState, setSaveState] = useState('Ready');

  useEffect(() => {
    const previousTitle = document.title;
    const previousHtmlClass = document.documentElement.className;
    const previousBodyClass = document.body.className;

    document.title = pageMeta.title;
    document.documentElement.className = 'light';
    document.body.className = 'bg-surface font-body text-on-surface';

    return () => {
      document.title = previousTitle;
      document.documentElement.className = previousHtmlClass;
      document.body.className = previousBodyClass;
    };
  }, []);

  const selectedField = useMemo(
    () => fields.find((field) => field.id === selectedFieldId) ?? fields[0],
    [fields, selectedFieldId],
  );

  const visibleFields = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return fields;
    }

    return fields.filter((field) => `${field.name} ${field.key} ${field.type}`.toLowerCase().includes(query));
  }, [fields, search]);

  function toggleRequired(fieldId) {
    setFields((current) =>
      current.map((field) => (field.id === fieldId ? { ...field, required: !field.required } : field)),
    );
    setSaveState('Unsaved changes');
  }

  function removeField(fieldId) {
    const nextFields = fields.filter((field) => field.id !== fieldId);
    setFields(nextFields);
    setSelectedFieldId((current) => {
      if (current !== fieldId) {
        return current;
      }

      return nextFields[0]?.id ?? '';
    });
    setSaveState('Unsaved changes');
  }

  function addField() {
    const nextField = {
      id: `field-${Date.now()}`,
      name: `Custom Field ${fields.length + 1}`,
      key: `custom_field_${fields.length + 1}`,
      type: 'String',
      validation: 'Optional()',
      required: false,
    };

    setFields((current) => [...current, nextField]);
    setSelectedFieldId(nextField.id);
    setSaveState('Unsaved changes');
  }

  function updateSelectedField(key, value) {
    setFields((current) => current.map((field) => (field.id === selectedFieldId ? { ...field, [key]: value } : field)));
    setSaveState('Unsaved changes');
  }

  function saveTemplate() {
    setSaveState('Saved 2s ago');
  }

  return (
    <div className="schema-page">
      <aside className="schema-page__sidebar">
        <div>
          <div className="schema-page__brand">
            <h1>Architectural Intelligence</h1>
            <p>Institutional Admin</p>
          </div>

          <nav className="schema-page__nav">
            <a href="#/axiom_main_dashboard">Dashboard</a>
            <a href="#/agent_intelligence_chat">Intelligence</a>
            <a href="#/add_new_source_url">Sources</a>
            <a href="#/live_agent_monitor_console">Automation</a>
            <a href="#/data_extraction_schema_builder" data-active="true">
              Documents
            </a>
          </nav>
        </div>

        <div className="schema-page__sidebar-footer">
          <a href="#/extraction_job_history">Logs</a>
          <a href="#/api_external_integrations">Status</a>
        </div>
      </aside>

      <div className="schema-page__main">
        <header className="schema-page__topbar">
          <label className="schema-page__search">
            <MaterialIcon>search</MaterialIcon>
            <input
              type="text"
              placeholder="Search templates or fields..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <div className="schema-page__topbar-actions">
            <button type="button" className="schema-page__icon-button" aria-label="Notifications">
              <MaterialIcon>notifications</MaterialIcon>
            </button>
            <button type="button" className="schema-page__icon-button" aria-label="Settings">
              <MaterialIcon>settings</MaterialIcon>
            </button>
          </div>
        </header>

        <main className="schema-page__content">
          <section className="schema-page__hero">
            <div>
              <p className="schema-page__eyebrow">Schema Laboratory</p>
              <h2>Property Extraction Template</h2>
              <p>
                Define structural mappings for institutional real estate assets and keep validation
                consistent across ingestion sources.
              </p>
            </div>

            <div className="schema-page__hero-actions">
              <button type="button" className="schema-page__ghost-button">
                Discard Changes
              </button>
              <button type="button" className="schema-page__primary-button" onClick={saveTemplate}>
                Save Template
              </button>
            </div>
          </section>

          <div className="schema-page__layout">
            <section className="schema-page__control-column">
              <article className="schema-page__panel">
                <p className="schema-page__section-label">Asset Category</p>
                <div className="schema-page__stack">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      className="schema-page__list-button"
                      data-active={activeCategory === category.id}
                      onClick={() => setActiveCategory(category.id)}
                    >
                      <span>{category.label}</span>
                      <MaterialIcon>{category.icon}</MaterialIcon>
                    </button>
                  ))}
                </div>
              </article>

              <article className="schema-page__panel">
                <p className="schema-page__section-label">Schema Variant</p>
                <div className="schema-page__chips">
                  {variants.map((variant) => (
                    <button
                      key={variant}
                      type="button"
                      className="schema-page__chip"
                      data-active={activeVariant === variant}
                      onClick={() => setActiveVariant(variant)}
                    >
                      {variant}
                    </button>
                  ))}
                </div>
              </article>

              <article className="schema-page__context-card">
                <p className="schema-page__section-label">Asset Context</p>
                <div className="schema-page__context-overlay" />
                <div className="schema-page__context-footer">
                  <strong>London Multi-Family</strong>
                  <span>Template ID: RES-LDN-04</span>
                </div>
              </article>
            </section>

            <section className="schema-page__builder-column">
              <div className="schema-page__toolbar">
                <div className="schema-page__toolbar-actions">
                  <button type="button" onClick={addField}>
                    <MaterialIcon>add_circle</MaterialIcon>
                    Add Field
                  </button>
                  <button type="button" onClick={addField}>
                    <MaterialIcon>file_download</MaterialIcon>
                    Import JSON
                  </button>
                </div>
                <span>
                  {fields.length} fields defined | {fields.filter((field) => field.required).length} required
                </span>
              </div>

              <div className="schema-page__builder-grid">
                <article className="schema-page__field-list">
                  <div className="schema-page__field-list-header">
                    <span>Field</span>
                    <span>Type</span>
                    <span>Required</span>
                  </div>

                  <div className="schema-page__field-items">
                    {visibleFields.map((field) => (
                      <div
                        key={field.id}
                        className="schema-page__field-row"
                        data-active={field.id === selectedFieldId}
                      >
                        <button
                          type="button"
                          className="schema-page__field-select"
                          onClick={() => setSelectedFieldId(field.id)}
                        >
                          <div>
                            <strong>{field.name}</strong>
                            <span>{field.key}</span>
                          </div>
                          <em>{field.type}</em>
                        </button>
                        <span className="schema-page__field-actions">
                          <button
                            type="button"
                            className="schema-page__toggle"
                            data-active={field.required}
                            onClick={() => toggleRequired(field.id)}
                          >
                            <span />
                          </button>
                          <button
                            type="button"
                            className="schema-page__delete"
                            onClick={() => removeField(field.id)}
                            aria-label={`Delete ${field.name}`}
                          >
                            <MaterialIcon>delete</MaterialIcon>
                          </button>
                        </span>
                      </div>
                    ))}
                  </div>

                  <button type="button" className="schema-page__add-row" onClick={addField}>
                    <MaterialIcon>add_circle</MaterialIcon>
                    Insert New Schema Field
                  </button>
                </article>

                <article className="schema-page__detail-panel">
                  <div className="schema-page__detail-header">
                    <div>
                      <p className="schema-page__section-label">Field Editor</p>
                      <h3>{selectedField?.name ?? 'Select a field'}</h3>
                    </div>
                    <span className="schema-page__save-state">{saveState}</span>
                  </div>

                  {selectedField ? (
                    <div className="schema-page__form-grid">
                      <label>
                        <span>Name</span>
                        <input
                          type="text"
                          value={selectedField.name}
                          onChange={(event) => updateSelectedField('name', event.target.value)}
                        />
                      </label>
                      <label>
                        <span>Key</span>
                        <input
                          type="text"
                          value={selectedField.key}
                          onChange={(event) => updateSelectedField('key', event.target.value)}
                        />
                      </label>
                      <label>
                        <span>Type</span>
                        <select
                          value={selectedField.type}
                          onChange={(event) => updateSelectedField('type', event.target.value)}
                        >
                          <option>String</option>
                          <option>Number</option>
                          <option>Object</option>
                          <option>Boolean</option>
                          <option>PDF</option>
                        </select>
                      </label>
                      <label>
                        <span>Validation</span>
                        <input
                          type="text"
                          value={selectedField.validation}
                          onChange={(event) => updateSelectedField('validation', event.target.value)}
                        />
                      </label>
                    </div>
                  ) : null}

                  <div className="schema-page__mapping-card">
                    <div>
                      <p className="schema-page__section-label">Intelligent Mapping</p>
                      <h4>Natural language extraction</h4>
                      <p>
                        Axiom maps unstructured broker text directly into these schema definitions
                        with high confidence.
                      </p>
                    </div>

                    <dl className="schema-page__mapping-stats">
                      <div>
                        <dt>Confidence</dt>
                        <dd>99.4%</dd>
                      </div>
                      <div>
                        <dt>Latency</dt>
                        <dd>2.1s</dd>
                      </div>
                    </dl>

                    <pre className="schema-page__mapping-log">{`"source": "Unstructured Broker PDF"
  -> "Property Title" mapped via Semantic Match
  -> "Price Guide" mapped via Regex Extraction
  -> "EPC Rating" mapped via OCR Vision`}</pre>
                  </div>
                </article>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
