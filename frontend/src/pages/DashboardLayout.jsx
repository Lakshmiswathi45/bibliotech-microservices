import { useState } from 'react';
import { Bell, BookMarked, BookOpen, ChevronLeft, ChevronRight, CircleDollarSign, LayoutDashboard, LogOut, Menu, UserRound, Users, X } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import SiteFooter from '../components/SiteFooter.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function DashboardLayout() {
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const admin = user.role === 'ADMIN';
  const links = [
    { to: admin ? '/admin/dashboard' : '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/catalogue', label: 'Browse books', icon: BookOpen },
    { to: admin ? '/admin/rentals' : '/dashboard/rentals', label: admin ? 'All rentals' : 'My borrowed books', icon: BookMarked },
    { to: admin ? '/admin/profile' : '/profile', label: 'My profile', icon: UserRound },
    { to: admin ? '/admin/fines' : '/dashboard/fines', label: 'Fines', icon: CircleDollarSign },
    { to: admin ? '/admin/notifications' : '/dashboard/notifications', label: 'Notifications', icon: Bell },
    ...(admin ? [{ to: '/admin/books', label: 'Manage books', icon: BookOpen }, { to: '/admin/users', label: 'Users', icon: Users }] : []),
  ];

  function logout() {
    signOut();
    navigate('/');
  }

  return (
    <div className="dashboard-frame">
      <aside className={`dashboard-sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand-row"><NavLink className="brand" to="/"><span className="brand-mark"><BookOpen size={20} /></span><span>Bibliotech<span className="brand-period">.</span></span></NavLink><button className="icon-button sidebar-close" type="button" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={20} /></button></div>
        <div className="sidebar-context"><span className="sidebar-avatar">{user.role === 'ADMIN' ? 'A' : 'R'}</span><div><span>{user.role === 'ADMIN' ? 'Library desk' : 'Reader account'}</span><strong>{user.role === 'ADMIN' ? 'Administrator' : 'My Bibliotech'}</strong></div></div>
        <span className="sidebar-label">YOUR SPACE</span>
        <nav className="sidebar-nav" aria-label="Dashboard navigation">{links.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} onClick={() => setMobileOpen(false)} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}><Icon size={18} /><span>{label}</span>{label === 'Browse books' && <ChevronRight className="sidebar-arrow" size={15} />}</NavLink>)}</nav>
        <div className="sidebar-bottom"><div className="sidebar-role"><span className="role-dot" /> Signed in as <strong>{user.role}</strong></div><button type="button" className="sidebar-signout" onClick={logout}><LogOut size={17} /> Sign out</button></div>
      </aside>
      {mobileOpen && <button type="button" className="sidebar-scrim" onClick={() => setMobileOpen(false)} aria-label="Close menu" />}
      <div className="dashboard-main-column">
        <header className="dashboard-topbar"><button className="icon-button dashboard-menu-button" onClick={() => setMobileOpen(true)} aria-label="Open dashboard menu"><Menu size={21} /></button><div className="breadcrumb"><span>Bibliotech</span><ChevronLeft size={13} /><strong>{admin ? 'Library desk' : 'Reader space'}</strong></div><NavLink to={admin ? '/admin/profile' : '/profile'} className="topbar-profile"><span className="topbar-avatar">{user.email?.[0]?.toUpperCase() || (admin ? 'A' : 'R')}</span><span>{user.email || `Member #${user.userId}`}</span></NavLink></header>
        <div className="dashboard-content"><Outlet /></div>
        <SiteFooter />
      </div>
    </div>
  );
}