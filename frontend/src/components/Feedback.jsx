import { AlertCircle, CheckCircle2, LoaderCircle } from 'lucide-react';

export function Feedback({ error, success }) {
  if (!error && !success) return null;
  return <div className={`feedback ${error ? 'feedback-error' : 'feedback-success'}`} role="status">
    {error ? <AlertCircle size={17} /> : <CheckCircle2 size={17} />}
    <span>{error || success}</span>
  </div>;
}

export function Loading({ label = 'Loading your library' }) {
  return <div className="loading-state"><LoaderCircle className="spin" size={24} /><span>{label}</span></div>;
}

export function EmptyState({ title, detail, icon: Icon }) {
  return <div className="empty-state">
    {Icon && <span className="empty-icon"><Icon size={22} /></span>}
    <h3>{title}</h3>
    <p>{detail}</p>
  </div>;
}