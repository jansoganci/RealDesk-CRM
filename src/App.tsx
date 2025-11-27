import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Login } from './features/auth/Login';
import { Register } from './features/auth/Register';
import { ForgotPassword } from './features/auth/ForgotPassword';
import { ResetPassword } from './features/auth/ResetPassword';
import { LandingPage } from './features/landing/LandingPage';
import { Dashboard } from './features/dashboard/Dashboard';
import { Owners } from './features/owners/Owners';
import { Properties } from './features/properties/Properties';
import { Tenants } from './features/tenants/Tenants';
import { Contracts } from './features/contracts/Contracts';
import ContractCreate from './features/contracts/ContractCreate';
import ContractEdit from './features/contracts/ContractEdit';
import { ContractImportPage } from './features/contracts/import/ContractImportPage';
import { Reminders } from './features/reminders/Reminders';
import { Inquiries } from './features/inquiries/Inquiries';
import { CalendarPage } from './features/calendar/CalendarPage';
import { Finance } from './features/finance/Finance';
import { Profile } from './features/profile/Profile';
import { ROUTES } from './config/constants';
import { Toaster } from './components/ui/sonner';
import { initializeExchangeRates } from './lib/currency';
import './App.css';

function App() {
  // Initialize exchange rates on app start
  useEffect(() => {
    initializeExchangeRates().catch(err => {
      console.warn('Failed to initialize exchange rates on app start:', err);
    });
  }, []);
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          <Route path={ROUTES.HOME} element={<LandingPage />} />
          <Route path={ROUTES.LOGIN} element={<Login />} />
          <Route path={ROUTES.REGISTER} element={<Register />} />
          <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
          <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />
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
          <Route
            path={ROUTES.CONTRACTS}
            element={
              <ProtectedRoute>
                <Contracts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contracts/create"
            element={
              <ProtectedRoute>
                <ContractCreate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contracts/:id/edit"
            element={
              <ProtectedRoute>
                <ContractEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contracts/import"
            element={
              <ProtectedRoute>
                <ContractImportPage />
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
        </Routes>
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
