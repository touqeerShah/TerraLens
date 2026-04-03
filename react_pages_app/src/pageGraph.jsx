const graphDefinition = {
  axiom_landing_page: {
    section: 'Public',
    description: 'Landing and entry point into the product.',
    outgoing: ['login', 'sign_up'],
  },
  login: {
    section: 'Public',
    description: 'Authentication entry into the workspace.',
    outgoing: ['axiom_main_dashboard', 'forgot_password'],
  },
  sign_up: {
    section: 'Public',
    description: 'Account creation and activation.',
    outgoing: ['onboarding_setup', 'axiom_main_dashboard'],
  },
  forgot_password: {
    section: 'Public',
    description: 'Password recovery from the login flow.',
    outgoing: ['login'],
  },
  onboarding_setup: {
    section: 'Public',
    description: 'Initial workspace setup after sign up.',
    outgoing: ['axiom_main_dashboard'],
  },
  axiom_main_dashboard: {
    section: 'Main',
    description: 'Primary command center for search, sources, analytics, and operations.',
    outgoing: [
      'property_search_filters',
      'agent_intelligence_chat',
      'axiom_map_explorer',
      'axiom_analytics_market_trends',
      'market_activity_analysis',
      'add_new_source_url',
      'document_upload_center',
      'manual_property_entry',
      'source_management_console',
      'live_agent_monitor_console',
      'global_automation_schedule',
      'extraction_repair_console',
      'review_correct_property_data',
      'my_intelligence_watchlists',
      'market_alerts_subscriptions',
      'workspace_team_settings',
      'role_permission_settings',
      'system_audit_logs',
      'api_external_integrations',
      'help_documentation_center',
    ],
  },
  property_search_filters: {
    section: 'Explore',
    description: 'Search flow into map, analytics, details, and watchlists.',
    outgoing: [
      'property_detail_page',
      'property_detail_view',
      'axiom_map_explorer',
      'axiom_analytics_market_trends',
      'market_activity_analysis',
      'my_intelligence_watchlists',
      'reports_data_exports_hub',
      'compare_properties_side_by_side',
    ],
  },
  agent_intelligence_chat: {
    section: 'Explore',
    description: 'Conversational exploration that opens properties, docs, and maps.',
    outgoing: [
      'property_detail_page',
      'property_detail_view',
      'axiom_map_explorer',
      'axiom_analytics_market_trends',
      'market_activity_analysis',
      'document_intelligence_analysis',
    ],
  },
  axiom_map_explorer: {
    section: 'Explore',
    description: 'Map-first discovery linked with search, analytics, and details.',
    outgoing: [
      'property_detail_page',
      'property_detail_view',
      'axiom_analytics_market_trends',
      'market_activity_analysis',
      'property_search_filters',
    ],
  },
  axiom_analytics_market_trends: {
    section: 'Explore',
    description: 'Market trends and high-level analytics connected to search and reports.',
    outgoing: [
      'property_search_filters',
      'axiom_map_explorer',
      'property_detail_page',
      'reports_data_exports_hub',
      'market_activity_analysis',
    ],
  },
  market_activity_analysis: {
    section: 'Explore',
    description: 'Detailed analysis view connected to search, maps, and exports.',
    outgoing: [
      'property_search_filters',
      'axiom_map_explorer',
      'property_detail_page',
      'reports_data_exports_hub',
      'axiom_analytics_market_trends',
    ],
  },
  add_new_source_url: {
    section: 'Input',
    description: 'New source intake feeding source operations and scheduling.',
    outgoing: ['source_management_console', 'live_agent_monitor_console', 'global_automation_schedule'],
  },
  document_upload_center: {
    section: 'Input',
    description: 'Document ingestion flow into document review and property linkage.',
    outgoing: ['document_intelligence_analysis', 'extraction_repair_console', 'property_detail_page'],
  },
  manual_property_entry: {
    section: 'Input',
    description: 'Manual property creation that feeds detail and repair flows.',
    outgoing: ['property_detail_page', 'extraction_repair_console'],
  },
  source_management_console: {
    section: 'Operations',
    description: 'Source catalog leading into source detail, schedule, and monitoring.',
    outgoing: [
      'source_detail_metropolis_commercial',
      'global_automation_schedule',
      'live_agent_monitor_console',
      'extraction_repair_console',
    ],
  },
  source_detail_metropolis_commercial: {
    section: 'Operations',
    description: 'Single source view with monitoring, scheduling, history, and schema links.',
    outgoing: [
      'live_agent_monitor_console',
      'global_automation_schedule',
      'extraction_repair_console',
      'extraction_job_history',
      'data_extraction_schema_builder',
    ],
  },
  live_agent_monitor_console: {
    section: 'Operations',
    description: 'Live agent run monitoring tied to source detail, history, and repair.',
    outgoing: ['source_detail_metropolis_commercial', 'extraction_job_history', 'extraction_repair_console'],
  },
  global_automation_schedule: {
    section: 'Operations',
    description: 'Scheduling and cron control for sources and agents.',
    outgoing: ['source_detail_metropolis_commercial', 'source_management_console', 'live_agent_monitor_console'],
  },
  extraction_job_history: {
    section: 'Operations',
    description: 'Historical run log for source jobs and agents.',
    outgoing: ['source_detail_metropolis_commercial', 'live_agent_monitor_console', 'extraction_repair_console'],
  },
  extraction_repair_console: {
    section: 'Operations',
    description: 'Repair and failed extraction workflow.',
    outgoing: [
      'source_detail_metropolis_commercial',
      'property_detail_page',
      'document_intelligence_analysis',
      'data_extraction_schema_builder',
      'deduplication_merge_center',
      'review_correct_property_data',
    ],
  },
  review_correct_property_data: {
    section: 'Operations',
    description: 'Human review queue for correcting extracted property records.',
    outgoing: [
      'source_detail_metropolis_commercial',
      'property_detail_page',
      'document_intelligence_analysis',
      'data_extraction_schema_builder',
      'deduplication_merge_center',
      'extraction_repair_console',
    ],
  },
  property_detail_page: {
    section: 'Data',
    description: 'Canonical property detail hub.',
    outgoing: [
      'property_detail_view',
      'document_intelligence_analysis',
      'deduplication_merge_center',
      'my_intelligence_watchlists',
      'compare_properties_side_by_side',
    ],
  },
  property_detail_view: {
    section: 'Data',
    description: 'Alternative detail presentation linked to the same downstream actions.',
    outgoing: [
      'property_detail_page',
      'document_intelligence_analysis',
      'deduplication_merge_center',
      'my_intelligence_watchlists',
      'compare_properties_side_by_side',
    ],
  },
  document_intelligence_analysis: {
    section: 'Data',
    description: 'Document detail and AI analysis view.',
    outgoing: ['property_detail_page', 'extraction_repair_console'],
  },
  my_intelligence_watchlists: {
    section: 'Data',
    description: 'Saved properties and lists linked back into search and compare.',
    outgoing: ['property_detail_page', 'property_search_filters', 'compare_properties_side_by_side'],
  },
  market_alerts_subscriptions: {
    section: 'Data',
    description: 'Alerts and notifications management.',
    outgoing: ['property_search_filters', 'my_intelligence_watchlists', 'agent_intelligence_chat'],
  },
  deduplication_merge_center: {
    section: 'Operations',
    description: 'Duplicate review and merge resolution.',
    outgoing: ['property_detail_page', 'extraction_repair_console'],
  },
  compare_properties_side_by_side: {
    section: 'Data',
    description: 'Side-by-side comparison launched from detail and watchlist flows.',
    outgoing: ['property_detail_page', 'property_search_filters'],
  },
  reports_data_exports_hub: {
    section: 'Data',
    description: 'Reports and export actions connected to analytics and search.',
    outgoing: ['axiom_analytics_market_trends', 'market_activity_analysis', 'property_search_filters'],
  },
  data_extraction_schema_builder: {
    section: 'Input',
    description: 'Schema and extraction template management.',
    outgoing: ['source_detail_metropolis_commercial', 'extraction_repair_console'],
  },
  workspace_team_settings: {
    section: 'Admin',
    description: 'Workspace and team administration.',
    outgoing: ['role_permission_settings', 'api_external_integrations', 'system_audit_logs'],
  },
  role_permission_settings: {
    section: 'Admin',
    description: 'Roles and permissions configuration.',
    outgoing: ['workspace_team_settings'],
  },
  system_audit_logs: {
    section: 'Admin',
    description: 'Audit trail for workspace activity.',
    outgoing: ['workspace_team_settings', 'role_permission_settings'],
  },
  api_external_integrations: {
    section: 'Admin',
    description: 'External integrations and API management.',
    outgoing: ['workspace_team_settings'],
  },
  help_documentation_center: {
    section: 'Admin',
    description: 'Documentation and support entry point.',
    outgoing: ['axiom_main_dashboard'],
  },
};

const sectionOrder = ['Public', 'Main', 'Explore', 'Data', 'Operations', 'Input', 'Admin', 'Other'];

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

export function enrichRoutesWithGraph(routes) {
  const pageRoutes = routes.filter((route) => route.path !== '/');
  const routeBySlug = Object.fromEntries(pageRoutes.map((route) => [route.slug, route]));
  const incomingMap = {};

  for (const [slug, config] of Object.entries(graphDefinition)) {
    for (const target of config.outgoing || []) {
      if (!incomingMap[target]) {
        incomingMap[target] = [];
      }

      incomingMap[target].push(slug);
    }
  }

  const enrichedRoutes = routes.map((route) => {
    if (route.path === '/') {
      return route;
    }

    const config = graphDefinition[route.slug] || {};
    const outgoing = unique(config.outgoing || []).map((slug) => routeBySlug[slug]).filter(Boolean);
    const incoming = unique(incomingMap[route.slug] || []).map((slug) => routeBySlug[slug]).filter(Boolean);

    return {
      ...route,
      section: config.section || 'Other',
      description: config.description || 'Converted page from the Stitch Property template set.',
      relatedRoutes: unique([...outgoing, ...incoming]),
      outgoingRoutes: outgoing,
      incomingRoutes: incoming,
    };
  });

  const groupedRoutes = sectionOrder
    .map((section) => ({
      section,
      routes: enrichedRoutes.filter((route) => route.section === section),
    }))
    .filter((group) => group.routes.length > 0);

  return { routes: enrichedRoutes, groupedRoutes };
}
