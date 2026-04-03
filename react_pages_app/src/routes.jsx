import AddNewSourceUrlPage, { pageMeta as AddNewSourceUrlPageMeta } from './pages/AddNewSourceUrlPage';
import AgentIntelligenceChatPage, { pageMeta as AgentIntelligenceChatPageMeta } from './pages/AgentIntelligenceChatPage';
import ApiExternalIntegrationsPage, { pageMeta as ApiExternalIntegrationsPageMeta } from './pages/ApiExternalIntegrationsPage';
import AxiomAnalyticsMarketTrendsPage, { pageMeta as AxiomAnalyticsMarketTrendsPageMeta } from './pages/AxiomAnalyticsMarketTrendsPage';
import AxiomLandingPage, { pageMeta as AxiomLandingPageMeta } from './pages/AxiomLandingPage';
import AxiomMainDashboardPage, { pageMeta as AxiomMainDashboardPageMeta } from './pages/AxiomMainDashboardPage';
import AxiomMapExplorerPage, { pageMeta as AxiomMapExplorerPageMeta } from './pages/AxiomMapExplorerPage';
import ComparePropertiesSideBySidePage, { pageMeta as ComparePropertiesSideBySidePageMeta } from './pages/ComparePropertiesSideBySidePage';
import DataExtractionSchemaBuilderPage, { pageMeta as DataExtractionSchemaBuilderPageMeta } from './pages/DataExtractionSchemaBuilderPage';
import DeduplicationMergeCenterPage, { pageMeta as DeduplicationMergeCenterPageMeta } from './pages/DeduplicationMergeCenterPage';
import DocumentIntelligenceAnalysisPage, { pageMeta as DocumentIntelligenceAnalysisPageMeta } from './pages/DocumentIntelligenceAnalysisPage';
import DocumentUploadCenterPage, { pageMeta as DocumentUploadCenterPageMeta } from './pages/DocumentUploadCenterPage';
import ExtractionJobHistoryPage, { pageMeta as ExtractionJobHistoryPageMeta } from './pages/ExtractionJobHistoryPage';
import ExtractionRepairConsolePage, { pageMeta as ExtractionRepairConsolePageMeta } from './pages/ExtractionRepairConsolePage';
import ForgotPasswordPage, { pageMeta as ForgotPasswordPageMeta } from './pages/ForgotPasswordPage';
import GlobalAutomationSchedulePage, { pageMeta as GlobalAutomationSchedulePageMeta } from './pages/GlobalAutomationSchedulePage';
import HelpDocumentationCenterPage, { pageMeta as HelpDocumentationCenterPageMeta } from './pages/HelpDocumentationCenterPage';
import LiveAgentMonitorConsolePage, { pageMeta as LiveAgentMonitorConsolePageMeta } from './pages/LiveAgentMonitorConsolePage';
import LoginPage, { pageMeta as LoginPageMeta } from './pages/LoginPage';
import ManualPropertyEntryPage, { pageMeta as ManualPropertyEntryPageMeta } from './pages/ManualPropertyEntryPage';
import MarketActivityAnalysisPage, { pageMeta as MarketActivityAnalysisPageMeta } from './pages/MarketActivityAnalysisPage';
import MarketAlertsSubscriptionsPage, { pageMeta as MarketAlertsSubscriptionsPageMeta } from './pages/MarketAlertsSubscriptionsPage';
import MyIntelligenceWatchlistsPage, { pageMeta as MyIntelligenceWatchlistsPageMeta } from './pages/MyIntelligenceWatchlistsPage';
import OnboardingSetupPage, { pageMeta as OnboardingSetupPageMeta } from './pages/OnboardingSetupPage';
import PropertyDetailPage, { pageMeta as PropertyDetailPageMeta } from './pages/PropertyDetailPage';
import PropertyDetailViewPage, { pageMeta as PropertyDetailViewPageMeta } from './pages/PropertyDetailViewPage';
import PropertySearchFiltersPage, { pageMeta as PropertySearchFiltersPageMeta } from './pages/PropertySearchFiltersPage';
import ReportsDataExportsHubPage, { pageMeta as ReportsDataExportsHubPageMeta } from './pages/ReportsDataExportsHubPage';
import ReviewCorrectPropertyDataPage, { pageMeta as ReviewCorrectPropertyDataPageMeta } from './pages/ReviewCorrectPropertyDataPage';
import RolePermissionSettingsPage, { pageMeta as RolePermissionSettingsPageMeta } from './pages/RolePermissionSettingsPage';
import SignUpPage, { pageMeta as SignUpPageMeta } from './pages/SignUpPage';
import SourceDetailMetropolisCommercialPage, { pageMeta as SourceDetailMetropolisCommercialPageMeta } from './pages/SourceDetailMetropolisCommercialPage';
import SourceManagementConsolePage, { pageMeta as SourceManagementConsolePageMeta } from './pages/SourceManagementConsolePage';
import SystemAuditLogsPage, { pageMeta as SystemAuditLogsPageMeta } from './pages/SystemAuditLogsPage';
import WorkspaceTeamSettingsPage, { pageMeta as WorkspaceTeamSettingsPageMeta } from './pages/WorkspaceTeamSettingsPage';

export const routes = [
  { path: '/', slug: 'home', label: 'Template Directory', title: 'Stitch Property React Pages' },
  { ...AddNewSourceUrlPageMeta, component: AddNewSourceUrlPage },
  { ...AgentIntelligenceChatPageMeta, component: AgentIntelligenceChatPage },
  { ...ApiExternalIntegrationsPageMeta, component: ApiExternalIntegrationsPage },
  { ...AxiomAnalyticsMarketTrendsPageMeta, component: AxiomAnalyticsMarketTrendsPage },
  { ...AxiomLandingPageMeta, component: AxiomLandingPage },
  { ...AxiomMainDashboardPageMeta, component: AxiomMainDashboardPage },
  { ...AxiomMapExplorerPageMeta, component: AxiomMapExplorerPage },
  { ...ComparePropertiesSideBySidePageMeta, component: ComparePropertiesSideBySidePage },
  { ...DataExtractionSchemaBuilderPageMeta, component: DataExtractionSchemaBuilderPage },
  { ...DeduplicationMergeCenterPageMeta, component: DeduplicationMergeCenterPage },
  { ...DocumentIntelligenceAnalysisPageMeta, component: DocumentIntelligenceAnalysisPage },
  { ...DocumentUploadCenterPageMeta, component: DocumentUploadCenterPage },
  { ...ExtractionJobHistoryPageMeta, component: ExtractionJobHistoryPage },
  { ...ExtractionRepairConsolePageMeta, component: ExtractionRepairConsolePage },
  { ...ForgotPasswordPageMeta, component: ForgotPasswordPage },
  { ...GlobalAutomationSchedulePageMeta, component: GlobalAutomationSchedulePage },
  { ...HelpDocumentationCenterPageMeta, component: HelpDocumentationCenterPage },
  { ...LiveAgentMonitorConsolePageMeta, component: LiveAgentMonitorConsolePage },
  { ...LoginPageMeta, component: LoginPage },
  { ...ManualPropertyEntryPageMeta, component: ManualPropertyEntryPage },
  { ...MarketActivityAnalysisPageMeta, component: MarketActivityAnalysisPage },
  { ...MarketAlertsSubscriptionsPageMeta, component: MarketAlertsSubscriptionsPage },
  { ...MyIntelligenceWatchlistsPageMeta, component: MyIntelligenceWatchlistsPage },
  { ...OnboardingSetupPageMeta, component: OnboardingSetupPage },
  { ...PropertyDetailPageMeta, component: PropertyDetailPage },
  { ...PropertyDetailViewPageMeta, component: PropertyDetailViewPage },
  { ...PropertySearchFiltersPageMeta, component: PropertySearchFiltersPage },
  { ...ReportsDataExportsHubPageMeta, component: ReportsDataExportsHubPage },
  { ...ReviewCorrectPropertyDataPageMeta, component: ReviewCorrectPropertyDataPage },
  { ...RolePermissionSettingsPageMeta, component: RolePermissionSettingsPage },
  { ...SignUpPageMeta, component: SignUpPage },
  { ...SourceDetailMetropolisCommercialPageMeta, component: SourceDetailMetropolisCommercialPage },
  { ...SourceManagementConsolePageMeta, component: SourceManagementConsolePage },
  { ...SystemAuditLogsPageMeta, component: SystemAuditLogsPage },
  { ...WorkspaceTeamSettingsPageMeta, component: WorkspaceTeamSettingsPage },
];
