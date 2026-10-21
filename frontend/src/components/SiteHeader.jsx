import { useState } from 'react';
import { BookOpen, LogOut, Menu, UserRound, X } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function SiteHeader() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  function logout() {
    signOut();
    setOpen(false);
    navigate('/');
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" to="/" onClick={() => setOpen(false)} aria-label="Bibliotech home">
          <span className="brand-mark"><BookOpen size={21} strokeWidth={1.8} /></span>
          <span>Bibliotech<span className="brand-period">.</span></span>
        </Link>
        <button className="icon-button mobile-menu" type="button" onClick={() => setOpen(!open)} aria-label={open ? 'Close navigation' : 'Open navigation'}>
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>
        <nav className={`main-nav ${open ? 'is-open' : ''}`} aria-label="Main navigation">
          <NavLink to="/" onClick={() => setOpen(false)}>Home</NavLink>
          <NavLink to="/catalogue" onClick={() => setOpen(false)}>Browse books</NavLink>
          {user ? (
            <>
              <NavLink to={user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'} onClick={() => setOpen(false)}>{user.role === 'ADMIN' ? 'Admin dashboard' : 'My dashboard'}</NavLink>
              <NavLink to={user.role === 'ADMIN' ? '/admin/rentals' : '/dashboard/rentals'} onClick={() => setOpen(false)}>{user.role === 'ADMIN' ? 'All rentals' : 'My books'}</NavLink>
              <NavLink className="header-profile" to={user.role === 'ADMIN' ? '/admin/profile' : '/profile'} onClick={() => setOpen(false)}><span className="header-avatar">{user.email?.[0]?.toUpperCase() || <UserRound size={15} />}</span><span>{user.email || 'My profile'}</span></NavLink>
              <button className="nav-auth-button" type="button" onClick={logout}><LogOut size={15} /> Logout</button>
            </>
          ) : (
            <>
              <NavLink to="/login" onClick={() => setOpen(false)}>Sign in</NavLink>
              <Link className="button button-small button-primary" to="/register" onClick={() => setOpen(false)}>Join the library</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}