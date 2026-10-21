import { BookOpen } from 'lucide-react';

const palettes = ['cover-rose', 'cover-coral', 'cover-ink', 'cover-blush'];

export default function BookCover({ book, compact = false }) {
  const palette = palettes[Math.abs(Number(book.id) || 0) % palettes.length];
  return <div className={`book-cover ${palette} ${compact ? 'book-cover-compact' : ''}`} aria-label={`Cover placeholder for ${book.title}`}>
    <span className="cover-rule" />
    <BookOpen size={compact ? 19 : 26} strokeWidth={1.35} />
    <span className="cover-title">{book.title}</span>
    <span className="cover-author">{book.author || 'Bibliotech collection'}</span>
  </div>;
}