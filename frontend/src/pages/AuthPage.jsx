import { useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Eye, EyeOff, ShieldCheck, UserRound } from 'lucide-react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Feedback } from '../components/Feedback.jsx';
import { errorMessage } from '../api/http.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthPage({ mode }) {
  const registering = mode === 'register';
  const { user, signIn, signUp } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'USER' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (user) return <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'} replace />;

  function update(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
    setError('');
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (registering && form.password !== form.confirmPassword) {
      setError('Your passwords do not match. Please check both fields.');
      return;
    }
    setBusy(true);
    try {
      if (registering) {
        await signUp({ name: form.name.trim(), email: form.email.trim(), password: form.password, role: form.role });
      }
      const session = await signIn({ email: form.email.trim(), password: form.password });
      navigate(location.state?.from?.pathname || (session.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'), { replace: true });
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-visual">
        <img src="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1200&q=85" alt="A quiet reading room with tall library shelves" />
        <div className="auth-visual-shade" />
        <Link className="auth-back" to="/"><ArrowLeft size={16} /> Back to Bibliotech</Link>
        <div className="auth-visual-copy"><span className="eyebrow eyebrow-light">A PLACE FOR EVERY STORY</span><p>“A reader lives a thousand lives before he dies.”</p><span>GEORGE R. R. MARTIN</span></div>
      </div>
      <div className="auth-form-side">
        <Link to="/" className="auth-mobile-brand"><span className="brand-mark"><BookOpen size={20} /></span>Bibliotech<span className="brand-period">.</span></Link>
        <div className="auth-form-wrap">
          <span className="eyebrow">{registering ? 'YOUR MEMBERSHIP BEGINS' : 'WELCOME BACK'}</span>
          <h1>{registering ? <>Join the<br /><em>reading room.</em></> : <>Good to see<br /><em>you again.</em></>}</h1>
          <p className="auth-intro">{registering ? 'Create an account and find a little more room for good ideas.' : 'Sign in to pick up where your reading life left off.'}</p>
          <Feedback error={error} />
          <form className="auth-form" onSubmit={submit}>
            {registering && <label className="field-label">Full name<input name="name" autoComplete="name" value={form.name} onChange={update} required maxLength={100} placeholder="Your name" /></label>}
            {registering && <fieldset className="role-selector">
              <legend>Account type</legend>
              <div className="role-options">
                <label className={`role-option ${form.role === 'USER' ? 'selected' : ''}`}>
                  <input type="radio" name="role" value="USER" checked={form.role === 'USER'} onChange={update} />
                  <span className="role-option-icon"><UserRound size={18} /></span>
                  <span className="role-option-copy"><strong>USER</strong><small>Browse and borrow books</small></span>
                  <span className="role-option-check" aria-hidden="true" />
                </label>
                <label className={`role-option ${form.role === 'ADMIN' ? 'selected' : ''}`}>
                  <input type="radio" name="role" value="ADMIN" checked={form.role === 'ADMIN'} onChange={update} />
                  <span className="role-option-icon"><ShieldCheck size={18} /></span>
                  <span className="role-option-copy"><strong>ADMIN</strong><small>Manage library operations</small></span>
                  <span className="role-option-check" aria-hidden="true" />
                </label>
              </div>
              {form.role === 'ADMIN' && <p className="role-admin-notice">Demo administrator account. This app allows registration with either role; protect access to this local demo environment.</p>}
            </fieldset>}
            <label className="field-label">Email address<input name="email" type="email" autoComplete="email" value={form.email} onChange={update} required maxLength={150} placeholder="you@example.com" /></label>
            <label className="field-label">Password<span className="password-field"><input name="password" type={showPassword ? 'text' : 'password'} autoComplete={registering ? 'new-password' : 'current-password'} value={form.password} onChange={update} required minLength={registering ? 8 : 1} maxLength={72} placeholder={registering ? 'At least 8 characters' : 'Your password'} /><button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label>
            {registering && <label className="field-label">Confirm password<span className="password-field"><input name="confirmPassword" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={form.confirmPassword} onChange={update} required minLength={8} maxLength={72} placeholder="Re-enter your password" /><button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label>}
            <button className="button button-primary auth-submit" type="submit" disabled={busy}>{busy ? 'Please wait…' : registering ? 'Create my account' : 'Sign in'} {registering ? <ArrowRight size={17} /> : <ArrowRight size={17} />}</button>
          </form>
          <p className="auth-switch">{registering ? 'Already have a membership?' : 'New to Bibliotech?'} <Link to={registering ? '/login' : '/register'}>{registering ? 'Sign in' : 'Create an account'}</Link></p>
          {registering && <p className="auth-note">{form.role === 'ADMIN' ? 'Administrator self-registration is enabled for this local demo. Keep this development site private.' : 'New accounts receive standard reader access.'}</p>}
        </div>
      </div>
    </main>
  );
}