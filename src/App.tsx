import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { Login } from './features/auth/Login';
import { LandingPage } from './features/landing/LandingPage';
import { Dashboard } from './features/dashboard/Dashboard';
import { Owners } from './features/owners/Owners';
import { Properties } from './features/properties/Properties';
import { Tenants } from './features/tenants/Tenants';
import { Contracts } from './features/contracts/Contracts';
import { Reminders } from './features/reminders/Reminders';
import { Inquiries } from './features/inquiries/Inquiries';
import { CalendarPage } from './features/calendar/CalendarPage';
import { Finance } from './features/finance/Finance';
import { Profile } from './features/profile/Profile';
import { ROUTES } from './config/constants';
import { Toaster } from './components/ui/sonner';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path={ROUTES.HOME} element={<LandingPage />} />
          <Route path={ROUTES.LOGIN} element={<Login />} />
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
  );
}

export default App;
