import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/Logo';
import { Mail, ArrowRight, ArrowLeft, Loader2, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const { loginViaEmailPassword, loginWithProvider } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Google OAuth simulation states
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    setError('');
    try {
      await loginViaEmailPassword(email, password);
      // Hard redirect to root path (which redirects to /home since profileCompleted is forced to true)
      window.location.href = '/';
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await loginWithProvider('google');
    } catch (err) {
      setError(err.message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-grid-pattern relative overflow-hidden">
      {/* Back to Landing Page */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-foreground transition-all py-2 px-3 bg-white/80 backdrop-blur-md border border-border rounded-lg shadow-sm hover:shadow"
        >
          <ArrowLeft size={14} /> Back to Home
        </Link>
      </div>

      {/* Ambient background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 relative z-10 text-left"
      >
        <div className="text-center">
          <Logo showText={false} height={64} className="mx-auto" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground font-display">
            NAB Connect
          </h2>
          <p className="mt-2 text-center text-sm text-muted">
            The Name You Can Trust
          </p>
        </div>

        <div className="glass-login-card rounded-xl p-8">
          <h3 className="text-lg font-bold text-foreground font-display mb-6 border-b border-border pb-3">
            Institutional Sign In
          </h3>

          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border-l-4 border-destructive text-destructive text-xs rounded-r font-medium animate-slide-up">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Method 1: Google Login */}
            <div>
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full h-11 flex justify-center items-center gap-2 rounded-lg border border-border bg-white text-xs font-bold text-foreground hover:bg-secondary transition-all cursor-pointer shadow-sm hover:shadow disabled:opacity-50"
              >
                <svg className="h-4 w-4 mr-1 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                Sign In with Google / Gmail
              </button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted font-bold">Or sign in manually</span>
              </div>
            </div>

            {/* Method 2: Email & Password Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                  Institutional Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    required
                    id="nab_email_input"
                    name="nab_email_input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="pharmacy@hospital.com"
                    autoComplete="email"
                    className="block w-full pl-10 pr-3 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-foreground uppercase tracking-wider">
                    Password
                  </label>
                  <Link to="/forgot-password" tabIndex={-1} className="text-xs text-primary hover:underline font-medium">
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                    <Lock size={16} />
                  </div>
                  <input
                    type="password"
                    required
                    id="nab_password_input"
                    name="nab_password_input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="block w-full pl-10 pr-3 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 flex justify-center items-center gap-2 rounded-lg bg-primary hover:bg-primary/95 text-xs font-bold text-white transition-all cursor-pointer shadow-md hover:shadow-lg disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <>
                    Sign In to Portal
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Registration link */}
          <p className="mt-6 text-center text-xs text-muted">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-primary hover:underline">
              Register Institution
            </Link>
          </p>
        </div>
      </motion.div>

      {/* Simulated Google Authentication Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center space-y-6 border border-slate-100 relative z-50"
          >
            <div className="flex justify-center">
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold font-display text-slate-800">
                Sign in with Google
              </h3>
              <p className="text-xs text-slate-500">
                to continue to <span className="font-semibold text-primary">NAB Connect</span>
              </p>
            </div>

            <form onSubmit={handleGoogleSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Google Email Address
                </label>
                <input
                  type="email"
                  required
                  id="nab_google_email"
                  name="nab_google_email"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="Enter Google/Gmail address"
                  autoComplete="off"
                  className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs font-semibold"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowGoogleModal(false);
                    setGoogleEmail('');
                  }}
                  className="flex-1 h-9 text-xs font-bold border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!googleEmail.includes('@')}
                  className="flex-1 h-9 text-xs font-bold bg-primary hover:bg-primary/95 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
