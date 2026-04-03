import { useEffect, useMemo, useState } from 'react';
import './RolePermissionSettingsPage.css';

export const pageMeta = {
  slug: 'role_permission_settings',
  path: '/role_permission_settings',
  label: 'Role Permission Settings',
  title: 'Axiom | Role & Permission Settings',
};

const rolePresets = {
  Administrator: {
    users: 12,
    securityLevel: 'Tier 1',
    permissions: {
      Sources: { create: true, edit: true, export: true, approve: true },
      Intelligence: { create: true, edit: true, export: false, approve: true },
      Operations: { create: true, edit: true, export: true, approve: true },
      Admin: { create: true, edit: true, export: true, approve: true },
    },
  },
  'Investment Analyst': {
    users: 26,
    securityLevel: 'Tier 2',
    permissions: {
      Sources: { create: true, edit: true, export: false, approve: false },
      Intelligence: { create: true, edit: true, export: true, approve: false },
      Operations: { create: false, edit: true, export: false, approve: false },
      Admin: { create: false, edit: false, export: false, approve: false },
    },
  },
  Viewer: {
    users: 41,
    securityLevel: 'Tier 3',
    permissions: {
      Sources: { create: false, edit: false, export: false, approve: false },
      Intelligence: { create: false, edit: false, export: true, approve: false },
      Operations: { create: false, edit: false, export: false, approve: false },
      Admin: { create: false, edit: false, export: false, approve: false },
    },
  },
};

const securityRulesTemplate = [
  { id: 'mfa', label: 'Require multi-factor authentication for privileged actions', enabled: true },
  { id: 'ip', label: 'Limit login to authorized corporate IP ranges', enabled: false },
];

function MaterialIcon({ children }) {
  return <span className="material-symbols-outlined">{children}</span>;
}

export default function RolePermissionSettingsPage() {
  const [activeRole, setActiveRole] = useState('Administrator');
  const [roles, setRoles] = useState(rolePresets);
  const [securityRules, setSecurityRules] = useState(securityRulesTemplate);

  useEffect(() => {
    const previousTitle = document.title;
    const previousHtmlClass = document.documentElement.className;
    const previousBodyClass = document.body.className;

    document.title = pageMeta.title;
    document.documentElement.className = 'light';
    document.body.className = 'bg-surface font-body text-on-surface min-h-screen';

    return () => {
      document.title = previousTitle;
      document.documentElement.className = previousHtmlClass;
      document.body.className = previousBodyClass;
    };
  }, []);

  const activePreset = useMemo(() => roles[activeRole], [roles, activeRole]);
  const activePermissions = activePreset.permissions;
  const moduleNames = Object.keys(activePermissions);

  function togglePermission(module, field) {
    setRoles((current) => ({
      ...current,
      [activeRole]: {
        ...current[activeRole],
        permissions: {
          ...current[activeRole].permissions,
          [module]: {
            ...current[activeRole].permissions[module],
            [field]: !current[activeRole].permissions[module][field],
          },
        },
      },
    }));
  }

  function toggleRule(id) {
    setSecurityRules((current) =>
      current.map((rule) => (rule.id === id ? { ...rule, enabled: !rule.enabled } : rule)),
    );
  }

  return (
    <div className="role-settings-page">
      <aside className="role-settings-page__sidebar">
        <div className="role-settings-page__brand">
          <div>
            <MaterialIcon>domain</MaterialIcon>
          </div>
          <div>
            <h1>Axiom</h1>
            <p>Property Intelligence</p>
          </div>
        </div>

        <nav>
          <a href="#/axiom_main_dashboard">Dashboard</a>
          <a href="#/property_search_filters">Search</a>
          <a href="#/axiom_analytics_market_trends">Analytics</a>
          <a href="#/role_permission_settings" data-active="true">
            Roles
          </a>
          <a href="#/workspace_team_settings">Workspace Settings</a>
        </nav>
      </aside>

      <div className="role-settings-page__main">
        <header className="role-settings-page__topbar">
          <label>
            <MaterialIcon>search</MaterialIcon>
            <input placeholder="Search permissions..." />
          </label>
          <button type="button">Create New Role</button>
        </header>

        <main className="role-settings-page__content">
          <section className="role-settings-page__hero">
            <div>
              <p>System Configuration</p>
              <h2>Roles &amp; Permissions</h2>
              <span>Define granular access levels for your team across property modules and analytical tools.</span>
            </div>
            <div className="role-settings-page__tabs">
              {Object.keys(roles).map((role) => (
                <button key={role} type="button" data-active={activeRole === role} onClick={() => setActiveRole(role)}>
                  {role}
                </button>
              ))}
            </div>
          </section>

          <section className="role-settings-page__grid">
            <div className="role-settings-page__permissions">
              <header>
                <span>Module</span>
                <span>Create</span>
                <span>Edit</span>
                <span>Export</span>
                <span>Approve</span>
              </header>

              {moduleNames.map((module) => (
                <article key={module}>
                  <div>
                    <strong>{module}</strong>
                    <p>
                      {module === 'Sources'
                        ? 'Feed intake and source administration'
                        : module === 'Intelligence'
                          ? 'Valuation and forecasting workflows'
                          : module === 'Operations'
                            ? 'Transaction and execution flow'
                            : 'User management and audit controls'}
                    </p>
                  </div>
                  {Object.entries(activePermissions[module]).map(([field, enabled]) => (
                    <label key={`${module}-${field}`}>
                      <input type="checkbox" checked={enabled} onChange={() => togglePermission(module, field)} />
                    </label>
                  ))}
                </article>
              ))}
            </div>

            <div className="role-settings-page__stack">
              <section className="role-settings-page__card">
                <h3>Advanced Security Rules</h3>
                {securityRules.map((rule) => (
                  <button key={rule.id} type="button" className="role-settings-page__rule" onClick={() => toggleRule(rule.id)}>
                    <span>{rule.label}</span>
                    <i data-active={rule.enabled} />
                  </button>
                ))}
              </section>

              <section className="role-settings-page__summary">
                <h3>Role Summary</h3>
                <p>{activeRole} access currently spans document review, source management, and intelligence controls.</p>
                <div>
                  <article>
                    <small>Assigned Users</small>
                    <strong>{activePreset.users}</strong>
                  </article>
                  <article>
                    <small>Security Level</small>
                    <strong>{activePreset.securityLevel}</strong>
                  </article>
                </div>
                <button type="button">Save Changes</button>
              </section>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
