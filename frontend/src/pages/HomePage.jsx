import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookMarked, Clock3, Compass, LibraryBig, Search, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getBooks } from '../api/books.js';
import { errorMessage } from '../api/http.js';
import BookCover from '../components/BookCover.jsx';
import { EmptyState, Feedback, Loading } from '../components/Feedback.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function HomePage() {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All subjects');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getBooks().then(setBooks).catch((reason) => setError(errorMessage(reason))).finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => ['All subjects', ...new Set(books.map((book) => book.category).filter(Boolean))], [books]);
  const featuredBooks = useMemo(() => books.filter((book) => {
    const phrase = `${book.title} ${book.author || ''} ${book.category || ''}`.toLowerCase();
    return phrase.includes(search.trim().toLowerCase()) && (category === 'All subjects' || book.category === category);
  }).slice(0, 4), [books, search, category]);

  return (
    <main>
      <section className="hero-section">
        <div className="hero-image-wrap">
          <img className="hero-image" src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1900&q=88" alt="Sunlit library shelves lined with books" />
          <div className="hero-image-shade" />
          <div className="hero-copy">
            <span className="eyebrow eyebrow-light"><span className="eyebrow-line" />YOUR NEXT CHAPTER STARTS HERE</span>
            <h1>A library for<br /><em>curious minds.</em></h1>
            <p>Discover something unexpected. Keep the stories that stay with you a little longer.</p>
            <div className="hero-actions">
              <Link to="/catalogue" className="button button-light">Search the collection <Search size={17} /></Link>
              {user ? <Link className="hero-secondary" to={user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'}>{user.role === 'ADMIN' ? 'Admin dashboard' : 'My library'}</Link> : <Link className="hero-secondary" to="/login">Sign in</Link>}
            </div>
          </div>
          <div className="hero-index"><span>01</span><span className="hero-index-line" /><span>03</span></div>
          <div className="hero-caption">A GOOD BOOK HAS A WAY OF FINDING YOU.</div>
        </div>
        <div className="hero-bottom"><span>Made for readers, built for discovery</span><span className="hero-bottom-mark">B<span>.</span></span><span>Browse. Borrow. Belong.</span></div>
      </section>

      <section className="section collection-section" id="collection">
        <div className="section-heading">
          <div><span className="eyebrow">THE COLLECTION</span><h2>Stories worth<br /><em>staying for.</em></h2></div>
          <Link className="text-link" to="/catalogue">Browse all {books.length} titles <ArrowRight size={16} /></Link>
        </div>
        <div className="catalogue-controls" aria-label="Search featured books">
          <label className="search-control"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by title, author, or subject" aria-label="Search books by title, author, or subject" /></label>
          <label className="category-control"><SlidersHorizontal size={17} /><select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter books by subject">{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
        </div>
        {loading ? <Loading label="Finding a few reader favorites" /> : error ? <Feedback error={error} /> : featuredBooks.length ? (
          <div className="featured-grid">{featuredBooks.map((book, index) => <article className="featured-book" key={book.id}><BookCover book={book} /><div className="featured-book-meta"><span className="book-category">{book.category || 'From the collection'}</span><h3>{book.title}</h3><p>{book.author}</p><span className={book.availableCopies > 0 ? 'availability availability-ready' : 'availability'}>{book.availableCopies > 0 ? `${book.availableCopies} available` : 'Currently on loan'}</span></div><span className="featured-number">0{index + 1}</span></article>)}</div>
        ) : <EmptyState title={books.length ? 'No books match those filters' : 'The catalogue is waiting'} detail={books.length ? 'Try another title, author, or subject.' : 'Once books are added, a few will be featured here.'} icon={LibraryBig} />}
      </section>

      <section className="story-band">
        <div className="story-side"><span className="eyebrow eyebrow-light">A BETTER WAY TO BORROW</span><span className="story-quote-mark">“</span><p>For the books you meant to read, and the ones you never knew you needed.</p><span className="story-signature">THE BIBLIOTECH WAY</span></div>
        <div className="feature-list">
          <div className="feature-row"><span className="feature-icon"><Compass size={19} /></span><div><h3>Find your next read</h3><p>Search a living catalogue by title, author, or category.</p></div><span className="feature-no">01</span></div>
          <div className="feature-row"><span className="feature-icon"><Clock3 size={19} /></span><div><h3>Borrow without the fuss</h3><p>Keep track of due dates and active loans in one place.</p></div><span className="feature-no">02</span></div>
          <div className="feature-row"><span className="feature-icon"><ShieldCheck size={19} /></span><div><h3>Your library, always in reach</h3><p>Secure sign-in keeps your reading life personal.</p></div><span className="feature-no">03</span></div>
        </div>
      </section>
      <section className="closing-cta"><span className="eyebrow">THERE'S ROOM ON THE SHELF</span><h2>Come in. Look around.<br /><em>Take a story home.</em></h2><Link to={user ? '/catalogue' : '/register'} className="button button-primary">{user ? 'Browse the catalogue' : 'Create your account'} <ArrowRight size={17} /></Link></section>
    </main>
  );
}