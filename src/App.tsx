import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext';
import { OrgProvider } from './contexts/OrgContext';
import { BillingProvider } from './contexts/BillingContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Login } from './features/auth/Login';
import { Register } from './features/auth/Register';
import { ForgotPassword } from './features/auth/ForgotPassword';
import { ResetPassword } from './features/auth/ResetPassword';
import { EmailConfirmation } from './features/auth/EmailConfirmation';
import { EmailChanged } from './features/auth/EmailChanged';
import { BillingSubscribe } from './features/billing/BillingSubscribe';
import { LandingPage } from './features/landing/LandingPage';
import { PublicPricingPage } from './features/landing/PublicPricingPage';
import { AboutPage } from './features/landing/AboutPage';
import { ContactPage } from './features/landing/ContactPage';
import { Dashboard } from './features/dashboard/Dashboard';
import { Owners } from './features/owners/Owners';
import { Properties } from './features/properties/Properties';
import { Tenants } from './features/tenants/Tenants';
import { Contracts } from './features/contracts/Contracts';
import ContractCreate from './features/contracts/ContractCreate';
import ContractEdit from './features/contracts/ContractEdit';
import { ContractImportPage } from './features/contracts/import/ContractImportPage';
import { ContractsHub } from './features/contractsHub/ContractsHub';
import { SaleContractsList } from './features/contractsSale/SaleContractsList';
import { SaleContractBuilder } from './features/contractsSale/SaleContractBuilder';
import { SaleContractEdit } from './features/contractsSale/SaleContractEdit';
import { Reminders } from './features/reminders/Reminders';
import { Inquiries } from './features/inquiries/Inquiries';
import { CalendarPage } from './features/calendar/CalendarPage';
import { Finance } from './features/finance/Finance';
import { Profile } from './features/profile/Profile';
import { TeamMembersList } from './features/organization/TeamMembersList';
import { AcceptInvite } from './features/organization/AcceptInvite';
import { Onboarding } from './features/onboarding/Onboarding';
import { ROUTES } from './config/constants';
import { Toaster } from './components/ui/sonner';
import { GTMPageViewTracker } from './components/GTMPageViewTracker';
import CookieNotice from './components/ui/cookie-notice';
import { CookieErrorBoundary } from './components/ui/cookie-error-boundary';
import { CookiePreferences } from './components/ui/cookie-preferences';
import { useCookieConsent } from './hooks/useCookieConsent';
import { initializeExchangeRates } from './lib/currency';
import './App.css';

function AppContent() {
  const { showPreferences, closePreferences } = useCookieConsent();

  return (
    <>
      <GTMPageViewTracker />
      <CookieErrorBoundary>
        <CookieNotice />
      </CookieErrorBoundary>
      <CookiePreferences open={showPreferences} onOpenChange={closePreferences} />
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
                path={ROUTES.TENANTS}
                element={
                  <ProtectedRoute>
                    <Tenants />
                  </ProtectedRoute>
                }
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
                    <SaleContractBuilder />
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
                path={ROUTES.OWNERS}
                element={
                  <ProtectedRoute>
                    <Owners />
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
              <Route
                path={ROUTES.INQUIRIES}
                element={
                  <ProtectedRoute>
                    <Inquiries />
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
                      <TeamMembersList />
                    </ProtectedRoute>
                  }
                />
      </Routes>
      <Toaster />
    </>
  );
}

function App() {
  // Initialize exchange rates on app start
  useEffect(() => {
    initializeExchangeRates().catch(err => {
      console.warn('Failed to initialize exchange rates on app start:', err);
    });
  }, []);
  return (
    <HelmetProvider>
      <ErrorBoundary>
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
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;
