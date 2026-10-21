import { useEffect, useState } from 'react';
import { ArrowRight, Bell, BookMarked, BookOpen, CalendarDays, CircleDollarSign, KeyRound, LogOut, RefreshCw, ShieldCheck, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { changePassword as requestPasswordChange, getProfile, updateProfile as requestProfileUpdate } from '../api/auth.js';
import { getBooks } from '../api/books.js';
import { getFinesForUser } from '../api/fines.js';
import { errorMessage } from '../api/http.js';
import { getNotificationsForUser } from '../api/notifications.js';
import { getRentalsForUser } from '../api/rentals.js';
import { EmptyState, Feedback, Loading } from '../components/Feedback.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const emptyActivity = { books: null, rentals: null, fines: null, notifications: null };

function formatDate(value) {
  if (!value) return 'Not set';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
}

function titleFor(books, id) {
  return books?.find((book) => book.id === id)?.title || `Book #${id}`;
}

function Metric({ icon: Icon, label, value, note }) {
  return <article className="profile-metric"><span className="profile-metric-icon"><Icon size={18} /></span><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>;
}

function metricValue(records, loading, emptyNote, populatedNote) {
  if (loading) return { value: '—', note: 'Loading records' };
  if (records === null) return { value: '—', note: 'Currently unavailable' };
  return { value: records.length, note: records.length ? populatedNote : emptyNote };
}

export default function ProfilePage() {
  const { user, signOut, updateAccount } = useAuth();
  const navigate = useNavigate();
  const admin = user.role === 'ADMIN';
  const rentalPath = admin ? '/admin/rentals' : '/dashboard/rentals';
  const finesPath = admin ? '/admin/fines' : '/dashboard/fines';
  const notificationsPath = admin ? '/admin/notifications' : '/dashboard/notifications';
  const [profile, setProfile] = useState(null);
  const [activity, setActivity] = useState(emptyActivity);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialog, setDialog] = useState(null);
  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  async function refresh() {
    setLoading(true);
    setError('');
    setSuccess('');
    const [profileResult, booksResult, rentalsResult, finesResult, notificationsResult] = await Promise.allSettled([
      getProfile(),
      getBooks(),
      getRentalsForUser(user.userId),
      getFinesForUser(user.userId),
      getNotificationsForUser(user.userId),
    ]);
    const nextProfile = profileResult.status === 'fulfilled' ? profileResult.value : null;
    if (nextProfile) {
      setProfile(nextProfile);
      updateAccount(nextProfile);
    } else {
      setProfile(null);
    }
    setActivity({
      books: booksResult.status === 'fulfilled' ? booksResult.value : null,
      rentals: rentalsResult.status === 'fulfilled' ? rentalsResult.value : null,
      fines: finesResult.status === 'fulfilled' ? finesResult.value : null,
      notifications: notificationsResult.status === 'fulfilled' ? notificationsResult.value : null,
    });
    const failures = [
      [profileResult, 'account profile'],
      [booksResult, 'book catalogue'],
      [rentalsResult, 'rental history'],
      [finesResult, 'fine records'],
      [notificationsResult, 'notifications'],
    ].filter(([result]) => result.status === 'rejected').map(([, label]) => label);
    if (failures.length) setError(`Unable to load ${failures.join(', ')}. Please refresh or try again later.`);
    setLoading(false);
  }

  useEffect(() => {
    refresh().catch((reason) => {
      setError(errorMessage(reason));
      setLoading(false);
    });
  }, [user.userId]);

  function closeDialog() {
    setDialog(null);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  }

  function openProfileEditor() {
    setProfileForm({ name: profile?.name || '', email: profile?.email || '' });
    setError('');
    setSuccess('');
    setDialog('profile');
  }

  async function saveProfile(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const updated = await requestProfileUpdate({
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
      });
      setProfile(updated);
      updateAccount(updated);
      setSuccess('Your profile has been updated.');
      closeDialog();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  async function savePassword(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('The new password and confirmation do not match.');
      return;
    }
    setBusy(true);
    try {
      await requestPasswordChange({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setSuccess('Your password has been changed.');
      closeDialog();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    if (!window.confirm('Sign out of Bibliotech?')) return;
    signOut();
    navigate('/');
  }

  const rentals = activity.rentals || [];
  const activeRentals = rentals.filter((rental) => rental.status === 'BORROWED' || rental.status === 'OVERDUE');
  const outstanding = (activity.fines || []).filter((fine) => Number(fine.fineAmount) > 0 && fine.status !== 'PAID');
  const initials = profile?.name?.trim()?.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
    || profile?.email?.trim()?.[0]?.toUpperCase()
    || 'B';
  const activeMetric = metricValue(activity.rentals, loading, 'No active loans', 'Currently borrowed');
  const rentalMetric = metricValue(activity.rentals, loading, 'No rental records', 'All your checkouts');
  const fineMetric = loading
    ? { value: '—', note: 'Loading records' }
    : activity.fines === null
      ? { value: '—', note: 'Currently unavailable' }
      : { value: outstanding.length, note: activity.fines.length ? (outstanding.length ? 'Unpaid fine records' : 'No outstanding fines') : 'No fine records' };
  const notificationMetric = metricValue(activity.notifications, loading, 'No notifications', 'Account updates');

  return <main className="profile-page">
    <div className="dash-page-heading">
      <div><span className="eyebrow">ACCOUNT & ACTIVITY</span><h1>My profile</h1><p>Your authenticated account and library activity.</p></div>
      <button className="button button-outline button-refresh" type="button" onClick={() => refresh().catch((reason) => { setError(errorMessage(reason)); setLoading(false); })} disabled={loading}><RefreshCw size={16} /> Refresh</button>
    </div>
    <Feedback error={error} success={success} />

    <section className="profile-identity-panel">
      <span className="profile-large-avatar">{initials}</span>
      <div className="profile-identity-copy"><span className="eyebrow">BIBLIOTECH MEMBER</span><h2>{profile?.name || (loading ? 'Loading account…' : 'Account unavailable')}</h2><p>Member #{profile?.id ?? user.userId} <span>·</span> {profile?.role || user.role}</p></div>
      <div className="profile-actions"><button className="button button-outline" type="button" disabled={!profile} onClick={openProfileEditor}><UserRound size={16} /> Edit profile</button><button className="button button-outline" type="button" disabled={!profile} onClick={() => { setError(''); setSuccess(''); setDialog('password'); }}><KeyRound size={16} /> Change password</button><button className="icon-button profile-logout" type="button" onClick={logout} aria-label="Log out" title="Log out"><LogOut size={18} /></button></div>
    </section>

    <section className="profile-details-panel" aria-labelledby="account-details-title">
      <div className="profile-section-heading"><div><span className="eyebrow">AUTHENTICATED ACCOUNT</span><h2 id="account-details-title">Account details</h2></div></div>
      {loading && !profile ? <Loading label="Loading account details" /> : <dl className="profile-details-grid"><div><dt>Full name</dt><dd>{profile?.name || 'Unavailable'}</dd></div><div><dt>Email address</dt><dd>{profile?.email || 'Unavailable'}</dd></div><div><dt>Account role</dt><dd><span className="profile-role"><ShieldCheck size={14} /> {profile?.role || 'Unavailable'}</span></dd></div><div><dt>Account ID</dt><dd>{profile ? `#${profile.id}` : 'Unavailable'}</dd></div></dl>}
    </section>

    <section className="profile-metrics" aria-label="Library activity summary">
      <Metric icon={BookMarked} label="Active loans" {...activeMetric} />
      <Metric icon={BookOpen} label="Rental history" {...rentalMetric} />
      <Metric icon={CircleDollarSign} label="Open fines" {...fineMetric} />
      <Metric icon={Bell} label="Notifications" {...notificationMetric} />
    </section>

    <div className="profile-activity-grid">
      <section className="profile-details-panel profile-loans-panel">
        <div className="profile-section-heading"><div><span className="eyebrow">{admin ? 'MY CHECKOUTS' : 'MY BOOKS'}</span><h2>Borrowing activity</h2></div><Link className="text-link" to={rentalPath}>View all <ArrowRight size={15} /></Link></div>
        {loading ? <Loading label="Loading your borrowing history" /> : activity.rentals === null ? <p className="profile-unavailable">Rental history is currently unavailable.</p> : rentals.length ? <div className="profile-rental-list">{[...rentals].sort((left, right) => String(right.borrowDate).localeCompare(String(left.borrowDate))).slice(0, 6).map((rental) => <article className="profile-rental-row" key={rental.id}><span className="profile-rental-icon"><BookOpen size={17} /></span><div className="profile-rental-title"><strong>{titleFor(activity.books, rental.bookId)}</strong><small>Borrowed {formatDate(rental.borrowDate)}</small></div><div className="profile-rental-due"><span><CalendarDays size={13} /> {rental.status === 'RETURNED' ? 'Returned' : 'Due'}</span><strong>{formatDate(rental.returnDate || rental.dueDate)}</strong></div><span className={`status-pill status-${rental.status?.toLowerCase()}`}>{rental.status}</span></article>)}</div> : <EmptyState title="No borrowed books yet" detail="Borrow a title from the catalogue to see it here." icon={BookMarked} />}
      </section>

      <aside className="profile-details-panel profile-activity-side">
        <div className="profile-section-heading"><div><span className="eyebrow">ACCOUNT UPDATES</span><h2>Notifications</h2></div><Link className="profile-icon-link" to={notificationsPath} aria-label="View all notifications"><ArrowRight size={16} /></Link></div>
        {loading ? <Loading label="Loading notifications" /> : activity.notifications === null ? <p className="profile-unavailable">Notifications are currently unavailable.</p> : activity.notifications.length ? <div className="profile-notifications">{[...activity.notifications].sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt))).slice(0, 4).map((notification) => <article key={notification.id}><span>{notification.type || 'Library update'}</span><p>{notification.message}</p></article>)}</div> : <EmptyState title="No notifications" detail="Library updates will appear here." icon={Bell} />}
      </aside>
    </div>
    {activity.fines?.length > 0 && <p className="data-note">Fine records are returned directly by the Fine Service. Amounts use the backend value; no currency is specified by the API. <Link to={finesPath}>Review fines <ArrowRight size={13} /></Link></p>}

    {dialog && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) closeDialog(); }}>
      <section className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-dialog-title">
        <div className="modal-heading"><div><span className="eyebrow">ACCOUNT SECURITY</span><h2 id="profile-dialog-title">{dialog === 'profile' ? 'Edit profile' : 'Change password'}</h2></div><button className="icon-button" type="button" onClick={closeDialog} disabled={busy} aria-label="Close dialog">×</button></div>
        <Feedback error={error} />
        {dialog === 'profile' ? <form className="book-form" onSubmit={saveProfile}>
          <label className="field-label">Full name<input autoFocus required maxLength={120} value={profileForm.name} onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })} /></label>
          <label className="field-label">Email address<input type="email" required maxLength={254} value={profileForm.email} onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })} /></label>
          <p className="profile-form-note">Account ID and role are protected and cannot be changed here.</p>
          <div className="modal-actions"><button type="button" className="button button-outline" onClick={closeDialog} disabled={busy}>Cancel</button><button className="button button-primary" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button></div>
        </form> : <form className="book-form" onSubmit={savePassword}>
          <label className="field-label">Current password<input autoFocus type="password" required autoComplete="current-password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })} /></label>
          <label className="field-label">New password<input type="password" required minLength={8} maxLength={72} autoComplete="new-password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })} /><small>Use at least 8 characters. Maximum length is 72 UTF-8 bytes.</small></label>
          <label className="field-label">Confirm new password<input type="password" required minLength={8} maxLength={72} autoComplete="new-password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })} /></label>
          <div className="modal-actions"><button type="button" className="button button-outline" onClick={closeDialog} disabled={busy}>Cancel</button><button className="button button-primary" disabled={busy}>{busy ? 'Updating…' : 'Change password'}</button></div>
        </form>}
      </section>
    </div>}
  </main>;
}
