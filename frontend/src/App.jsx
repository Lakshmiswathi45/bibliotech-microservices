import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import SiteFooter from './components/SiteFooter.jsx';
import SiteHeader from './components/SiteHeader.jsx';
import AuthPage from './pages/AuthPage.jsx';
import CataloguePage from './pages/CataloguePage.jsx';
import DashboardLayout from './pages/DashboardLayout.jsx';
import { AdminBooksPage, AdminUsersPage, FinesPage, NotificationsPage, OverviewPage, RentalsPage } from './pages/DashboardPages.jsx';
import HomePage from './pages/HomePage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';

function RouteFrame() {
  const location = useLocation();
  const { user } = useAuth();
  const dashboardRoute = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin');
  return <>
    {!dashboardRoute && <SiteHeader />}
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/catalogue" element={<CataloguePage />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route element={<ProtectedRoute roles={['USER']} />}>
            <Route path="/dashboard" element={<OverviewPage />} />
            <Route path="/dashboard/rentals" element={<RentalsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/dashboard/fines" element={<FinesPage />} />
            <Route path="/dashboard/notifications" element={<NotificationsPage />} />
          </Route>
          <Route element={<ProtectedRoute roles={['ADMIN']} />}>
            <Route path="/admin/dashboard" element={<OverviewPage />} />
            <Route path="/admin/rentals" element={<RentalsPage />} />
            <Route path="/admin/profile" element={<ProfilePage />} />
            <Route path="/admin/fines" element={<FinesPage />} />
            <Route path="/admin/notifications" element={<NotificationsPage />} />
            <Route path="/admin/books" element={<AdminBooksPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/'} replace />} />
    </Routes>
    {!dashboardRoute && <SiteFooter />}
  </>;
}

export default function App() {
  return <RouteFrame />;
}