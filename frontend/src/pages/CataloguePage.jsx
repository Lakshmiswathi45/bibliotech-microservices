import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, BookOpen, Search, SlidersHorizontal, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { adjustAvailability, getBooks } from '../api/books.js';
import { borrowBook } from '../api/rentals.js';
import { errorMessage } from '../api/http.js';
import BookCover from '../components/BookCover.jsx';
import { EmptyState, Feedback, Loading } from '../components/Feedback.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function CataloguePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All subjects');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selected, setSelected] = useState(null);

  async function refresh() {
    const data = await getBooks();
    setBooks(data);
    setSelected((current) => current ? data.find((book) => book.id === current.id) || null : null);
  }

  useEffect(() => {
    refresh().catch((reason) => setError(errorMessage(reason))).finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => ['All subjects', ...new Set(books.map((book) => book.category).filter(Boolean))], [books]);
  const filtered = useMemo(() => books.filter((book) => {
    const phrase = `${book.title} ${book.author || ''} ${book.isbn || ''} ${book.category || ''}`.toLowerCase();
    return phrase.includes(search.trim().toLowerCase()) && (category === 'All subjects' || book.category === category);
  }), [books, search, category]);

  async function borrow(book) {
    if (book.availableCopies <= 0) return;
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/catalogue' } } });
      return;
    }
    setBusyId(book.id);
    setError('');
    setSuccess('');
    try {
      await borrowBook(user.userId, book.id, 14);
      await refresh();
      setSuccess(`“${book.title}” is now on your loans.`);
      setSelected(null);
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusyId(null);
    }
  }

  async function changeCopies(book, change) {
    setBusyId(book.id);
    setError('');
    try {
      await adjustAvailability(book.id, change);
      await refresh();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="catalogue-page page-container">
      <div className="page-kicker"><span className="eyebrow">THE BIBLIOTECH COLLECTION</span><span className="kicker-count">{books.length} TITLES ON THE SHELF</span></div>
      <div className="catalogue-heading"><div><h1>Find your<br /><em>next somewhere.</em></h1><p>Search the stacks for an idea, a voice, a place you haven't been yet.</p></div><span className="catalogue-stamp"><BookOpen size={24} /><span>READ<br />WIDELY</span></span></div>
      <div className="catalogue-controls">
        <label className="search-control"><Search size={19} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Title, author, ISBN, or subject" aria-label="Search books" />{search && <button type="button" className="clear-search" onClick={() => setSearch('')} aria-label="Clear search"><X size={17} /></button>}</label>
        <label className="category-control"><SlidersHorizontal size={17} /><select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by subject">{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
      </div>
      <Feedback error={error} success={success} />
      {loading ? <Loading label="Opening the catalogue" /> : error ? null : filtered.length ? <div className="catalogue-grid">{filtered.map((book) => <article className="catalogue-card" key={book.id}>
        <button className="book-card-open" type="button" onClick={() => setSelected(book)} aria-label={`View ${book.title} details`}><BookCover book={book} /><span className="book-open-icon"><ArrowUpRight size={18} /></span></button>
        <div className="catalogue-card-info"><span className="book-category">{book.category || 'General'}</span><h2>{book.title}</h2><p>{book.author || 'Author not listed'}</p><div className="catalogue-card-bottom"><span className={`availability ${book.availableCopies > 0 ? 'availability-ready' : ''}`}>{book.availableCopies > 0 ? `${book.availableCopies} available` : 'On loan'}</span><button type="button" className="borrow-inline" disabled={book.availableCopies <= 0 || busyId === book.id} onClick={() => borrow(book)}>{busyId === book.id ? 'Working…' : book.availableCopies > 0 ? 'Borrow' : 'Unavailable'}</button></div>
          {user?.role === 'ADMIN' && <div className="availability-adjust"><span>Adjust stock</span><button type="button" title="Decrease available copies" disabled={busyId === book.id || book.availableCopies <= 0} onClick={() => changeCopies(book, -1)}>−</button><button type="button" title="Increase available copies" disabled={busyId === book.id || book.availableCopies >= book.totalCopies} onClick={() => changeCopies(book, 1)}>+</button></div>}
        </div>
      </article>)}</div> : <EmptyState title="No books match that search" detail="Try another title, author, or subject." icon={Search} />}
      {selected && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}><section className="book-modal" role="dialog" aria-modal="true" aria-labelledby="book-modal-title"><button className="icon-button modal-close" onClick={() => setSelected(null)} aria-label="Close book details"><X size={20} /></button><BookCover book={selected} /><div className="book-modal-copy"><span className="book-category">{selected.category || 'General'}</span><h2 id="book-modal-title">{selected.title}</h2><p className="modal-author">by {selected.author || 'Author not listed'}</p><dl><div><dt>ISBN</dt><dd>{selected.isbn || 'Not listed'}</dd></div><div><dt>Copies</dt><dd>{selected.availableCopies} available of {selected.totalCopies}</dd></div></dl><button className="button button-primary" disabled={selected.availableCopies <= 0 || busyId === selected.id} onClick={() => borrow(selected)}>{busyId === selected.id ? 'Processing…' : selected.availableCopies > 0 ? 'Borrow for 14 days' : 'No copies available'} <ArrowUpRight size={17} /></button></div></section></div>}
    </main>
  );
}