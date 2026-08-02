import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext';
import { OrgProvider } from './contexts/OrgContext';
import { BillingProvider } from './contexts/BillingContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { OwnerOnlyRoute } from './components/common/OwnerOnlyRoute';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Login } from './features/auth/Login';
import { Register } from './features/auth/Register';
import { ForgotPassword } from './features/auth/ForgotPassword';
import { ResetPassword } from './features/auth/ResetPassword';
import { EmailConfirmation } from './features/auth/EmailConfirmation';
import { EmailChanged } from './features/auth/EmailChanged';
import { AuthCallback } from './features/auth/AuthCallback';
import { BillingSubscribe } from './features/billing/BillingSubscribe';
import { Dashboard } from './features/dashboard/Dashboard';
import { ROUTES } from './config/constants';
import { Toaster } from './components/ui/sonner';
import { GTMPageViewTracker } from './components/GTMPageViewTracker';
import CookieNotice from './components/ui/cookie-notice';
import { CookieErrorBoundary } from './components/ui/cookie-error-boundary';
import { CookiePreferences } from './components/ui/cookie-preferences';
import { useCookieConsent } from './hooks/useCookieConsent';
import './App.css';

const LandingPage = lazy(() =>
  import('./features/landing/LandingPage').then(({ LandingPage }) => ({ default: LandingPage })),
);
const PublicPricingPage = lazy(() =>
  import('./features/landing/PublicPricingPage').then(({ PublicPricingPage }) => ({ default: PublicPricingPage })),
);
const AboutPage = lazy(() =>
  import('./features/landing/AboutPage').then(({ AboutPage }) => ({ default: AboutPage })),
);
const ContactPage = lazy(() =>
  import('./features/landing/ContactPage').then(({ ContactPage }) => ({ default: ContactPage })),
);
const Properties = lazy(() =>
  import('./features/properties/Properties').then(({ Properties }) => ({ default: Properties })),
);
const Contracts = lazy(() =>
  import('./features/contracts/Contracts').then(({ Contracts }) => ({ default: Contracts })),
);
const ContractCreate = lazy(() => import('./features/contracts/ContractCreate'));
const ContractEdit = lazy(() => import('./features/contracts/ContractEdit'));
const LeaseWizardPage = lazy(() =>
  import('./features/contracts/leaseWizard/LeaseWizardPage').then(({ LeaseWizardPage }) => ({ default: LeaseWizardPage })),
);
const PurchaseWizardPage = lazy(() =>
  import('./features/contracts/purchaseWizard/PurchaseWizardPage').then(({ PurchaseWizardPage }) => ({ default: PurchaseWizardPage })),
);
const PurchaseContractDetailPage = lazy(() =>
  import('./features/contracts/purchaseWizard/PurchaseContractDetailPage').then(({ PurchaseContractDetailPage }) => ({ default: PurchaseContractDetailPage })),
);
const LeaseDetailPage = lazy(() =>
  import('./features/contracts/LeaseDetail').then(({ LeaseDetailPage }) => ({ default: LeaseDetailPage })),
);
const ContractImportPage = lazy(() =>
  import('./features/contracts/import/ContractImportPage').then(({ ContractImportPage }) => ({ default: ContractImportPage })),
);
const ContractsHub = lazy(() =>
  import('./features/contractsHub/ContractsHub').then(({ ContractsHub }) => ({ default: ContractsHub })),
);
const SaleContractsList = lazy(() =>
  import('./features/contractsSale/SaleContractsList').then(({ SaleContractsList }) => ({ default: SaleContractsList })),
);
const SaleContractEdit = lazy(() =>
  import('./features/contractsSale/SaleContractEdit').then(({ SaleContractEdit }) => ({ default: SaleContractEdit })),
);
const Reminders = lazy(() =>
  import('./features/reminders/Reminders').then(({ Reminders }) => ({ default: Reminders })),
);
const Leads = lazy(() =>
  import('./features/leads/Leads').then(({ Leads }) => ({ default: Leads })),
);
const LeadDetailPage = lazy(() =>
  import('./features/leads/LeadDetailPage').then(({ LeadDetailPage }) => ({ default: LeadDetailPage })),
);
const Deals = lazy(() =>
  import('./features/deals/Deals').then(({ Deals }) => ({ default: Deals })),
);
const DealDetail = lazy(() =>
  import('./features/deals/DealDetail').then(({ DealDetail }) => ({ default: DealDetail })),
);
const TimelinePage = lazy(() =>
  import('./features/timeline/TimelinePage').then(({ TimelinePage }) => ({ default: TimelinePage })),
);
const CalendarPage = lazy(() =>
  import('./features/calendar/CalendarPage').then(({ CalendarPage }) => ({ default: CalendarPage })),
);
const Finance = lazy(() =>
  import('./features/finance/Finance').then(({ Finance }) => ({ default: Finance })),
);
const Profile = lazy(() =>
  import('./features/profile/Profile').then(({ Profile }) => ({ default: Profile })),
);
const TeamPerformance = lazy(() =>
  import('./features/team/TeamPerformance').then(({ TeamPerformance }) => ({ default: TeamPerformance })),
);
const TeamMembersList = lazy(() =>
  import('./features/organization/TeamMembersList').then(({ TeamMembersList }) => ({ default: TeamMembersList })),
);
const ScreeningPage = lazy(() =>
  import('./features/screening/ScreeningPage').then(({ ScreeningPage }) => ({ default: ScreeningPage })),
);
const DepositTrackerPage = lazy(() =>
  import('./features/deposit-tracker/DepositTrackerPage').then(({ DepositTrackerPage }) => ({ default: DepositTrackerPage })),
);
const CompliancePage = lazy(() =>
  import('./features/compliance/CompliancePage').then(({ CompliancePage }) => ({ default: CompliancePage })),
);
const ComplianceDashboard = lazy(() =>
  import('./features/compliance/ComplianceDashboard').then(({ ComplianceDashboard }) => ({ default: ComplianceDashboard })),
);
const AcceptInvite = lazy(() =>
  import('./features/organization/AcceptInvite').then(({ AcceptInvite }) => ({ default: AcceptInvite })),
);
const Onboarding = lazy(() =>
  import('./features/onboarding/Onboarding').then(({ Onboarding }) => ({ default: Onboarding })),
);

function RouteLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
    </div>
  );
}

function AppContent() {
  const { showPreferences, closePreferences } = useCookieConsent();

  return (
    <>
      <GTMPageViewTracker />
      <CookieErrorBoundary>
        <CookieNotice />
      </CookieErrorBoundary>
      <CookiePreferences open={showPreferences} onOpenChange={closePreferences} />
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
                <Route path={ROUTES.HOME} element={<LandingPage />} />
              <Route path={ROUTES.LOGIN} element={<Login />} />
              <Route path={ROUTES.REGISTER} element={<Register />} />
              <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
              <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />
              <Route path={ROUTES.CONFIRM_EMAIL} element={<EmailConfirmation />} />
              <Route path={ROUTES.EMAIL_CHANGED} element={<EmailChanged />} />
              <Route path={ROUTES.PRICING} element={<PublicPricingPage />} />
              <Route path={ROUTES.ABOUT} element={<AboutPage />} />
              <Route path={ROUTES.CONTACT} element={<ContactPage />} />
              <Route path={ROUTES.ACCEPT_INVITE} element={<AcceptInvite />} />
              <Route path={ROUTES.AUTH_CALLBACK} element={<AuthCallback />} />
              <Route path={ROUTES.CCPA} element={<CompliancePage />} />
              <Route
                path={ROUTES.ONBOARDING}
                element={
                  <ProtectedRoute>
                    <Onboarding />
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.BILLING_SUBSCRIBE}
                element={
                  <ProtectedRoute>
                    <BillingSubscribe />
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.DASHBOARD}
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.PROPERTIES}
                element={
                  <ProtectedRoute>
                    <Properties />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owners"
                element={<Navigate to={`${ROUTES.PROPERTIES}?tab=owners`} replace />}
              />
              <Route
                path="/tenants"
                element={<Navigate to={`${ROUTES.PROPERTIES}?tab=tenants`} replace />}
              />
              {/* Contracts Hub */}
              <Route
                path={ROUTES.CONTRACTS_HUB}
                element={
                  <ProtectedRoute>
                    <ContractsHub />
                  </ProtectedRoute>
                }
              />

              {/* Rent Contracts */}
              <Route
                path={ROUTES.CONTRACTS_RENT}
                element={
                  <ProtectedRoute>
                    <Contracts />
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.CONTRACTS_RENT_CREATE}
                element={
                  <ProtectedRoute>
                    <ContractCreate />
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.CONTRACTS_RENT_EDIT}
                element={
                  <ProtectedRoute>
                    <ContractEdit />
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.CONTRACTS_RENT_IMPORT}
                element={
                  <ProtectedRoute>
                    <ContractImportPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.CONTRACTS_LEASE_NEW}
                element={
                  <ProtectedRoute>
                    <OwnerOnlyRoute>
                      <LeaseWizardPage />
                    </OwnerOnlyRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.CONTRACTS_LEASE_WIZARD}
                element={<Navigate to={ROUTES.CONTRACTS_LEASE_NEW} replace />}
              />
              <Route
                path={ROUTES.CONTRACTS_PURCHASE_NEW}
                element={
                  <ProtectedRoute>
                    <OwnerOnlyRoute>
                      <PurchaseWizardPage />
                    </OwnerOnlyRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.CONTRACTS_PURCHASE_DETAIL}
                element={
                  <ProtectedRoute>
                    <PurchaseContractDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.CONTRACTS_LEASE_DETAIL}
                element={
                  <ProtectedRoute>
                    <LeaseDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.CONTRACT_DETAIL}
                element={
                  <ProtectedRoute>
                    <LeaseDetailPage />
                  </ProtectedRoute>
                }
              />

              {/* Sale Contracts */}
              <Route
                path={ROUTES.CONTRACTS_SALE}
                element={
                  <ProtectedRoute>
                    <SaleContractsList />
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.CONTRACTS_SALE_CREATE}
                element={
                  <ProtectedRoute>
                    <OwnerOnlyRoute>
                      <Navigate to={ROUTES.CONTRACTS_PURCHASE_NEW} replace />
                    </OwnerOnlyRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.CONTRACTS_SALE_EDIT}
                element={
                  <ProtectedRoute>
                    <SaleContractEdit />
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.REMINDERS}
                element={
                  <ProtectedRoute>
                    <Reminders />
                  </ProtectedRoute>
                }
              />
              <Route path={ROUTES.INQUIRIES} element={<Navigate to={ROUTES.LEADS} replace />} />
              <Route
                path={ROUTES.LEADS}
                element={
                  <ProtectedRoute>
                    <Leads />
                  </ProtectedRoute>
                }
              />
              {/* /leads/:id deep-link route */}
              <Route
                path={ROUTES.LEAD_DETAIL}
                element={
                  <ProtectedRoute>
                    <LeadDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.DEALS}
                element={
                  <ProtectedRoute>
                    <Deals />
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.DEAL_DETAIL}
                element={
                  <ProtectedRoute>
                    <DealDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.TIMELINE}
                element={
                  <ProtectedRoute>
                    <TimelinePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.CALENDAR}
                element={
                  <ProtectedRoute>
                    <CalendarPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.FINANCE}
                element={
                  <ProtectedRoute>
                    <Finance />
                  </ProtectedRoute>
                }
              />
                <Route
                  path={ROUTES.PROFILE}
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path={ROUTES.TEAM}
                  element={
                    <ProtectedRoute>
                      <OwnerOnlyRoute>
                        <TeamPerformance />
                      </OwnerOnlyRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path={ROUTES.TEAM_MEMBERS}
                  element={
                    <ProtectedRoute>
                      <OwnerOnlyRoute>
                        <TeamMembersList />
                      </OwnerOnlyRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path={ROUTES.SCREENING}
                  element={
                    <ProtectedRoute>
                      <ScreeningPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path={ROUTES.DEPOSIT_TRACKER}
                  element={
                    <ProtectedRoute>
                      <DepositTrackerPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path={ROUTES.CCPA_DASHBOARD}
                  element={
                    <ProtectedRoute>
                      <ComplianceDashboard />
                    </ProtectedRoute>
                  }
                />
        </Routes>
      </Suspense>
      <Toaster />
    </>
  );
}

function App() {
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <OrgProvider>
              <BillingProvider>
                <NotificationProvider>
                  <BrowserRouter>
                    <AppContent />
                  </BrowserRouter>
                </NotificationProvider>
              </BillingProvider>
            </OrgProvider>
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;
