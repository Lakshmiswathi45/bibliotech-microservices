import { useEffect, useState } from 'react';
import { ArrowRight, Bell, BookMarked, BookOpen, CalendarDays, CircleDollarSign, Plus, RefreshCw, Search, Trash2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { adjustAvailability, createBook, deleteBook, getBooks, updateBook } from '../api/books.js';
import { getFinesForUser, markDemoPaymentPaid } from '../api/fines.js';
import { getNotificationsForUser } from '../api/notifications.js';
import { getRentals, getRentalsForUser, returnBook as returnRental } from '../api/rentals.js';
import { errorMessage } from '../api/http.js';
import BookCover from '../components/BookCover.jsx';
import { EmptyState, Feedback, Loading } from '../components/Feedback.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getUsers } from '../api/auth.js';
import { getAllFines } from '../api/fines.js';

function useDashboardData() {
  const { user } = useAuth();
  const admin = user.role === 'ADMIN';
  const [data, setData] = useState({ books: [], rentals: [], fines: [], notifications: [], users: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function refresh() {
    setError('');
    try {
      const [books, rentalRecords, notifications, users, adminFines] = await Promise.all([
        getBooks(),
        admin ? getRentals() : getRentalsForUser(user.userId),
        getNotificationsForUser(user.userId),
        admin ? getUsers() : Promise.resolve([]),
        admin ? getAllFines() : Promise.resolve(null),
      ]);
      const rentals = currentRentalStatuses(rentalRecords);
      let fines = adminFines || [];
      if (!admin) {
        fines = await getFinesForUser(user.userId);
      }
      setData({ books, rentals, fines, notifications, users });
    } catch (reason) {
      setError(errorMessage(reason));
    }
  }

  useEffect(() => {
    refresh().catch((reason) => setError(errorMessage(reason))).finally(() => setLoading(false));
  }, [user.userId, admin]);

  return { ...data, admin, loading, error, refresh, setError };
}

function PageHeading({ eyebrow, title, detail, action }) {
  return <div className="dash-page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{detail && <p>{detail}</p>}</div>{action}</div>;
}

function MetricCard({ label, value, note, icon: Icon, tone = '' }) {
  return <article className={`metric-card ${tone}`}><div className="metric-top"><span>{label}</span><span className="metric-icon"><Icon size={19} /></span></div><strong>{value}</strong><p>{note}</p></article>;
}

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
}

function currentRentalStatuses(rentals) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return rentals.map((rental) => {
    const dueDate = rental.dueDate ? new Date(`${rental.dueDate}T00:00:00`) : null;
    return rental.status !== 'RETURNED' && dueDate && dueDate < today
      ? { ...rental, status: 'OVERDUE' }
      : rental;
  });
}

function bookTitle(books, bookId) {
  return books.find((book) => book.id === bookId)?.title || `Book #${bookId}`;
}

export function OverviewPage() {
  const { user } = useAuth();
  const data = useDashboardData();
  const { books, rentals, fines, notifications, admin, loading, error, refresh } = data;
  const active = rentals.filter((rental) => rental.status === 'BORROWED' || rental.status === 'OVERDUE');
  const outstanding = fines.filter((fine) => Number(fine.fineAmount) > 0 && fine.status !== 'PAID');
  const availableCopies = books.reduce((sum, book) => sum + Number(book.availableCopies || 0), 0);

  return <>
    <PageHeading eyebrow={admin ? 'AT A GLANCE' : 'YOUR READING LIFE'} title={admin ? 'Library overview' : 'A good day to read.'} detail={admin ? 'A clear view of your shelves and circulation.' : `Welcome back. Your next chapter is waiting, member #${user.userId}.`} action={<button className="button button-outline button-refresh" onClick={() => refresh()}><RefreshCw size={16} /> Refresh</button>} />
    <Feedback error={error} />
    {loading ? <Loading label="Gathering your library overview" /> : <>
      <div className={`metrics-grid ${admin ? 'admin-metrics-grid' : ''}`}>
        <MetricCard label={admin ? 'Titles in catalogue' : 'Books on loan'} value={admin ? books.length : active.length} note={admin ? 'Distinct book records' : 'Currently active rentals'} icon={admin ? BookOpen : BookMarked} />
        <MetricCard label={admin ? 'Physical copies' : 'Titles to explore'} value={admin ? books.reduce((sum, book) => sum + Number(book.totalCopies || 0), 0) : books.length} note={admin ? 'Total inventory' : 'In the live catalogue'} icon={admin ? BookMarked : Search} tone="metric-pink" />
        <MetricCard label={admin ? 'Available copies' : 'Outstanding fines'} value={admin ? availableCopies : outstanding.length} note={admin ? 'Ready to borrow' : outstanding.length ? 'Unpaid records' : 'You are all clear'} icon={admin ? BookMarked : CircleDollarSign} />
        {admin && <MetricCard label="Borrowed copies" value={books.reduce((sum, book) => sum + Number(book.totalCopies || 0) - Number(book.availableCopies || 0), 0)} note="Physical minus available" icon={BookOpen} tone="metric-pink" />}
        <MetricCard label={admin ? 'Active rentals' : 'Notifications'} value={admin ? active.length : notifications.length} note={admin ? 'Borrowed or overdue' : 'Stored account updates'} icon={admin ? Users : Bell} tone="metric-rose" />
        {admin && <MetricCard label="Returned rentals" value={rentals.filter((rental) => rental.status === 'RETURNED').length} note="Completed checkouts" icon={BookMarked} />}
        {admin && <MetricCard label="Overdue rentals" value={rentals.filter((rental) => rental.status === 'OVERDUE').length} note="Past due and unreturned" icon={CalendarDays} tone="metric-pink" />}
        <MetricCard label={admin ? 'Outstanding fines' : 'Notifications'} value={admin ? outstanding.length : notifications.length} note={admin ? outstanding.length ? 'Unpaid fine records' : 'No outstanding balances' : 'Stored account updates'} icon={admin ? CircleDollarSign : Bell} />
      </div>
      <div className="overview-columns"><section className="dashboard-panel"><div className="panel-heading"><div><span className="eyebrow">{admin ? 'CIRCULATION' : 'YOUR CHECKOUTS'}</span><h2>{admin ? 'Recent rentals' : 'Currently borrowed'}</h2></div><Link to={admin ? '/admin/rentals' : '/dashboard/rentals'} className="text-link">View all <ArrowRight size={15} /></Link></div>{active.length ? <div className="compact-rental-list">{active.slice(0, 5).map((rental) => <div className="compact-rental" key={rental.id}><span className="rental-small-cover"><BookOpen size={18} /></span><div className="compact-rental-info"><strong>{bookTitle(books, rental.bookId)}</strong><span>Due {formatDate(rental.dueDate)}</span></div><span className={`status-pill status-${rental.status.toLowerCase()}`}>{rental.status}</span></div>)}</div> : <EmptyState title="No active checkouts" detail="Borrow a book from the catalogue and it will appear here." icon={BookMarked} />}</section>
        <aside className="dashboard-panel dashboard-note-panel"><span className="note-icon"><CalendarDays size={20} /></span><span className="eyebrow">A SMALL REMINDER</span><h2>Good stories have a return date.</h2><p>Keep an eye on your due dates from the borrowed books page. Returning on time keeps the shelves moving.</p><Link to={admin ? '/admin/rentals' : '/dashboard/rentals'} className="text-link">Review due dates <ArrowRight size={15} /></Link></aside></div>
      {admin && <div className="admin-shortcuts"><Link to="/admin/books"><BookOpen size={19} /><span>Manage catalogue</span><ArrowRight size={16} /></Link><Link to="/admin/rentals"><Users size={19} /><span>Review circulation</span><ArrowRight size={16} /></Link></div>}
    </>}
  </>;
}

export function RentalsPage() {
  const data = useDashboardData();
  const { books, rentals, users, admin, loading, error, setError, refresh } = data;
  const [busyId, setBusyId] = useState(null);
  const [success, setSuccess] = useState('');

  async function doReturn(rental) {
    if (!window.confirm(`Return “${bookTitle(books, rental.bookId)}”?`)) return;
    setBusyId(rental.id);
    setSuccess('');
    setError('');
    try {
      const result = await returnRental(rental.id);
      await refresh();
      const amount = Number(result.fine?.fineAmount || 0);
      setSuccess(amount > 0 ? `Book returned. A fine of ${amount.toFixed(2)} was recorded; the backend does not specify a currency.` : 'Book returned and inventory updated.');
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusyId(null);
    }
  }

  return <>
    <PageHeading eyebrow={admin ? 'CIRCULATION DESK' : 'YOUR CHECKOUTS'} title={admin ? 'Rental records' : 'Borrowed books'} detail={admin ? 'All recorded rentals from the library service.' : 'Your borrowed titles, due dates, and return status.'} action={<button className="button button-outline button-refresh" onClick={() => refresh()}><RefreshCw size={16} /> Refresh</button>} />
    <Feedback error={error} success={success} />
    {loading ? <Loading label="Loading rental records" /> : rentals.length ? <div className="table-wrap"><table className="data-table"><thead><tr>{admin && <th>Member</th>}<th>Book</th><th>Borrowed</th><th>Due date</th><th>Returned</th><th>Status</th>{!admin && <th />}</tr></thead><tbody>{rentals.map((rental) => { const member = users.find((item) => item.id === rental.userId); return <tr key={rental.id}>{admin && <td><div className="table-book"><span><strong>{member?.name || `Member #${rental.userId}`}</strong><small>ID #{rental.userId}</small></span></div></td>}<td><div className="table-book"><span className="table-cover"><BookOpen size={17} /></span><span><strong>{bookTitle(books, rental.bookId)}</strong><small>Book #{rental.bookId} · Rental #{rental.id}</small></span></div></td><td>{formatDate(rental.borrowDate)}</td><td>{formatDate(rental.dueDate)}</td><td>{formatDate(rental.returnDate)}</td><td><span className={`status-pill status-${rental.status?.toLowerCase()}`}>{rental.status}</span></td>{!admin && <td>{rental.status !== 'RETURNED' && <button className="button button-small button-outline" disabled={busyId === rental.id} onClick={() => doReturn(rental)}>{busyId === rental.id ? 'Returning…' : 'Return book'}</button>}</td>}</tr>; })}</tbody></table></div> : <EmptyState title="No rental records yet" detail="When you borrow a title, your checkout history will be kept here." icon={BookMarked} />}
  </>;
}

export function FinesPage() {
  const { fines, rentals, books, admin, loading, error, refresh, setError } = useDashboardData();
  const [busyId, setBusyId] = useState(null);
  const [success, setSuccess] = useState('');

  async function markPaid(fine) {
    if (!window.confirm(`Mark rental #${fine.rentalId} as paid in the local demo? No payment will be processed.`)) return;
    setBusyId(fine.rentalId);
    setError('');
    setSuccess('');
    try {
      await markDemoPaymentPaid(fine.rentalId);
      await refresh();
      setSuccess('Demo payment status saved as PAID. No real payment was processed.');
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusyId(null);
    }
  }

  return <>
    <PageHeading eyebrow="ACCOUNT DETAILS" title="Fines & balances" detail="Fine records returned by the circulation service." action={<button className="button button-outline button-refresh" onClick={() => refresh()}><RefreshCw size={16} /> Refresh</button>} />
    <Feedback error={error} success={success} />
    {loading ? <Loading label="Checking fine records" /> : fines.length ? <div className="table-wrap"><table className="data-table"><thead><tr>{admin && <th>Member ID</th>}<th>Book</th><th>Rental</th><th>Overdue days</th><th>Amount</th><th>Status</th>{!admin && <th />}</tr></thead><tbody>{fines.map((fine) => <tr key={fine.id}>{admin && <td>#{fine.userId}</td>}<td>{bookTitle(books, rentals.find((rental) => rental.id === fine.rentalId)?.bookId || fine.rentalId)}</td><td>#{fine.rentalId}</td><td>{fine.daysOverdue}</td><td className="fine-amount">{Number(fine.fineAmount || 0).toFixed(2)}</td><td><span className="status-pill status-fine">{fine.status}</span></td>{!admin && <td>{fine.status !== 'PAID' && Number(fine.fineAmount) > 0 && <button className="button button-small button-outline" disabled={busyId === fine.rentalId} onClick={() => markPaid(fine)}>{busyId === fine.rentalId ? 'Saving…' : 'Mark paid (demo)'}</button>}</td>}</tr>)}</tbody></table></div> : <EmptyState title="No fine records found" detail="Any fine returned by the backend will be listed here." icon={CircleDollarSign} />}
    <p className="data-note">Fine amounts use backend values without a currency. Demo payment only updates the stored status to PAID; no money or payment credentials are handled.</p>
  </>;
}

export function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = () => getNotificationsForUser(user.userId).then(setNotifications).catch((reason) => setError(errorMessage(reason)));

  useEffect(() => { refresh().finally(() => setLoading(false)); }, [user.userId]);
  return <>
    <PageHeading eyebrow="ACCOUNT ACTIVITY" title="Notifications" detail="Updates created by your borrow and return activity." action={<button className="button button-outline button-refresh" onClick={() => refresh()}><RefreshCw size={16} /> Refresh</button>} />
    <Feedback error={error} />
    {loading ? <Loading label="Loading notifications" /> : notifications.length ? <div className="notification-list">{[...notifications].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).map((notification) => <article className="notification-row" key={notification.id}><span className="notification-icon"><Bell size={18} /></span><div><div className="notification-topline"><strong>{notification.type || 'Library update'}</strong><span>{notification.createdAt ? new Date(notification.createdAt).toLocaleString() : 'Date unavailable'}</span></div><p>{notification.message}</p>{notification.rentalId != null && <span className="notification-ref">Rental #{notification.rentalId}</span>}</div></article>)}</div> : <EmptyState title="Nothing new on the desk" detail="Borrow and return updates will appear here when created by the library service." icon={Bell} />}
    <p className="data-note">Notifications can only be retrieved for the signed-in user's ID by the current API.</p>
  </>;
}

const emptyBook = { title: '', author: '', isbn: '', category: '', totalCopies: 1, availableCopies: 1 };

export function AdminBooksPage() {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All categories');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState(null);

  const categories = ['All categories', ...new Set(books.map((book) => book.category).filter(Boolean))];
  const filteredBooks = books.filter((book) => {
    const phrase = `${book.title} ${book.author || ''} ${book.isbn || ''} ${book.category || ''}`.toLowerCase();
    return phrase.includes(search.trim().toLowerCase()) && (category === 'All categories' || book.category === category);
  });

  function refresh() { return getBooks().then(setBooks).catch((reason) => setError(errorMessage(reason))); }
  useEffect(() => { refresh().finally(() => setLoading(false)); }, []);

  function openForm(book = null) {
    setForm(book ? { ...book } : { ...emptyBook });
    setError('');
    setSuccess('');
  }

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');
    const payload = { ...form, totalCopies: Number(form.totalCopies), availableCopies: Number(form.availableCopies) };
    try {
      if (payload.totalCopies < 0 || payload.availableCopies < 0 || payload.availableCopies > payload.totalCopies) throw new Error('Available copies must be between zero and total copies.');
      if (form.id) await updateBook(form.id, payload);
      else await createBook(payload);
      await refresh();
      setSuccess(form.id ? 'Book details updated.' : 'Book added to the catalogue.');
      setForm(null);
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  async function remove(book) {
    if (!window.confirm(`Delete “${book.title}” from the catalogue? This cannot be undone.`)) return;
    setError('');
    setSuccess('');
    try {
      await deleteBook(book.id);
      await refresh();
      setSuccess(`“${book.title}” was deleted.`);
    } catch (reason) {
      setError(errorMessage(reason));
    }
  }

  async function adjust(book, change) {
    setBusy(true);
    setError('');
    try {
      await adjustAvailability(book.id, change);
      await refresh();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  return <>
    <PageHeading eyebrow="CATALOGUE MANAGEMENT" title="Manage the shelves" detail="Create titles, edit records, and adjust available copies." action={<button className="button button-primary" onClick={() => openForm()}><Plus size={17} /> Add a book</button>} />
    <Feedback error={error} success={success} />
    <div className="catalogue-controls"><label className="search-control"><Search size={18} /><input aria-label="Search inventory" placeholder="Search title, author, ISBN, or category" value={search} onChange={(event) => setSearch(event.target.value)} /></label><label className="category-control"><Search size={16} /><select aria-label="Filter inventory by category" value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label></div>
    {loading ? <Loading label="Loading catalogue" /> : filteredBooks.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Title</th><th>ISBN</th><th>Copies</th><th>Available now</th><th>Actions</th></tr></thead><tbody>{filteredBooks.map((book) => <tr key={book.id}><td><div className="table-book"><span className="table-cover"><BookOpen size={17} /></span><span><strong>{book.title}</strong><small>{book.author} · {book.category || 'General'}</small></span></div></td><td>{book.isbn || '—'}</td><td>{book.totalCopies}</td><td><div className="copy-stepper"><button type="button" aria-label={`Decrease ${book.title} availability`} disabled={busy || book.availableCopies <= 0} onClick={() => adjust(book, -1)}>−</button><strong>{book.availableCopies}</strong><button type="button" aria-label={`Increase ${book.title} availability`} disabled={busy || book.availableCopies >= book.totalCopies} onClick={() => adjust(book, 1)}>+</button></div></td><td><div className="table-actions"><button className="button button-small button-outline" onClick={() => openForm(book)}>Edit</button><button className="icon-button delete-button" title="Delete book" onClick={() => remove(book)}><Trash2 size={17} /></button></div></td></tr>)}</tbody></table></div> : <EmptyState title={books.length ? 'No inventory matches' : 'The shelves are ready'} detail={books.length ? 'Try another search or category.' : 'Add the first book to make it available in the live catalogue.'} icon={BookOpen} />}
    {form && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setForm(null); }}><section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="book-form-title"><div className="modal-heading"><div><span className="eyebrow">CATALOGUE RECORD</span><h2 id="book-form-title">{form.id ? 'Edit book' : 'Add a book'}</h2></div><button className="icon-button" onClick={() => setForm(null)} aria-label="Close form">×</button></div><form className="book-form" onSubmit={save}><label className="field-label">Title<input autoFocus required maxLength={200} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label><label className="field-label">Author<input maxLength={160} value={form.author || ''} onChange={(event) => setForm({ ...form, author: event.target.value })} /></label><div className="form-two-col"><label className="field-label">ISBN<input maxLength={40} value={form.isbn || ''} onChange={(event) => setForm({ ...form, isbn: event.target.value })} /></label><label className="field-label">Category<input maxLength={80} value={form.category || ''} onChange={(event) => setForm({ ...form, category: event.target.value })} /></label><label className="field-label">Total copies<input type="number" min="0" required value={form.totalCopies} onChange={(event) => setForm({ ...form, totalCopies: event.target.value })} /></label><label className="field-label">Available copies<input type="number" min="0" max={form.totalCopies} required value={form.availableCopies} onChange={(event) => setForm({ ...form, availableCopies: event.target.value })} /></label></div><div className="modal-actions"><button type="button" className="button button-outline" onClick={() => setForm(null)}>Cancel</button><button className="button button-primary" disabled={busy}>{busy ? 'Saving…' : form.id ? 'Save changes' : 'Add to catalogue'}</button></div></form></section></div>}
  </>;
}

export function AdminUsersPage() {
  const [users, setUsers] = useState(null);
  const [fines, setFines] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const filteredUsers = (users || []).filter((user) => `${user.name} ${user.email} ${user.id}`.toLowerCase().includes(search.trim().toLowerCase()));
  const openFines = (fines || []).filter((fine) => Number(fine.fineAmount) > 0 && fine.status !== 'PAID');
  const totalOutstanding = openFines.reduce((sum, fine) => sum + Number(fine.fineAmount || 0), 0);

  async function refresh() {
    setLoading(true);
    setError('');
    const [usersResult, finesResult] = await Promise.allSettled([getUsers(), getAllFines()]);
    setUsers(usersResult.status === 'fulfilled' ? usersResult.value : null);
    setFines(finesResult.status === 'fulfilled' ? finesResult.value : null);
    const failures = [
      [usersResult, 'member directory'],
      [finesResult, 'fine records'],
    ].filter(([result]) => result.status === 'rejected').map(([, label]) => label);
    if (failures.length) setError(`Unable to load ${failures.join(' and ')}. Please refresh or try again later.`);
    setLoading(false);
  }

  useEffect(() => {
    refresh().catch((reason) => {
      setError(errorMessage(reason));
      setLoading(false);
    });
  }, []);

  return <>
    <PageHeading eyebrow="MEMBERSHIP & BALANCES" title="Members and fines" detail="Member directory and fine history from the secured backend APIs." action={<button className="button button-outline button-refresh" onClick={() => refresh()} disabled={loading}><RefreshCw size={16} /> Refresh</button>} />
    <Feedback error={error} />
    {loading ? <Loading label="Loading members and fine records" /> : <>
      <div className="metrics-grid"><MetricCard label="Members" value={users === null ? '—' : users.length} note={users === null ? 'Unavailable' : 'Registered accounts'} icon={Users} /><MetricCard label="Fine records" value={fines === null ? '—' : fines.length} note={fines === null ? 'Unavailable' : 'All recorded fine statuses'} icon={CircleDollarSign} tone="metric-pink" /><MetricCard label="Outstanding" value={fines === null ? '—' : openFines.length} note={fines === null ? 'Unavailable' : 'Unpaid fine records'} icon={CircleDollarSign} /><MetricCard label="Outstanding total" value={fines === null ? '—' : totalOutstanding.toFixed(2)} note={fines === null ? 'Unavailable' : 'Currency unspecified by API'} icon={CircleDollarSign} tone="metric-rose" /></div>
      {users !== null && <div className="catalogue-controls"><label className="search-control"><Search size={18} /><input aria-label="Search members" placeholder="Search by name, email, or member ID" value={search} onChange={(event) => setSearch(event.target.value)} /></label></div>}
      {users === null ? <EmptyState title="Member directory unavailable" detail="The secured Auth Service request did not return member data. Use Refresh after checking your administrator access and service connection." icon={Users} /> : filteredUsers.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Member</th><th>Email</th><th>Role</th><th>Fine records</th><th>Outstanding</th><th>Fine statuses</th></tr></thead><tbody>{filteredUsers.map((member) => { const memberFines = (fines || []).filter((fine) => fine.userId === member.id); const memberOpen = memberFines.filter((fine) => Number(fine.fineAmount) > 0 && fine.status !== 'PAID'); const total = memberOpen.reduce((sum, fine) => sum + Number(fine.fineAmount || 0), 0); return <tr key={member.id}><td><div className="table-book"><span className="sidebar-avatar">{member.name?.[0]?.toUpperCase() || 'M'}</span><span><strong>{member.name}</strong><small>Member #{member.id}</small></span></div></td><td>{member.email}</td><td><span className="status-pill">{member.role}</span></td><td>{fines === null ? 'Unavailable' : memberFines.length}</td><td className="fine-amount">{fines === null ? '—' : total.toFixed(2)}</td><td>{fines === null ? 'Unavailable' : memberFines.length ? memberFines.map((fine) => <span className={`status-pill status-${fine.status?.toLowerCase()}`} key={fine.id}>#{fine.rentalId} {fine.status}</span>) : 'No fine records'}</td></tr>; })}</tbody></table></div> : <EmptyState title={users.length ? 'No members match' : 'No registered members'} detail={users.length ? 'Try a different name, email, or ID.' : 'The member directory returned no accounts.'} icon={Users} />}
      <p className="data-note">Fine amounts are displayed as returned. The backend does not specify a currency or payment endpoint.</p>
    </>}
  </>;
}