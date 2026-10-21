import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <Link className="brand footer-brand" to="/"><span className="brand-mark"><BookOpen size={18} /></span><span>Bibliotech<span className="brand-period">.</span></span></Link>
        <p>A little more room for good ideas.</p>
        <span className="footer-copy">© {new Date().getFullYear()} Bibliotech</span>
      </div>
    </footer>
  );
}