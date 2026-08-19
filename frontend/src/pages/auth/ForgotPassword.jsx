import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/Logo';
import { Mail, ArrowLeft, Loader2, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ForgotPassword() {
  const { resetPasswordRequest } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await resetPasswordRequest(email);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-grid-pattern relative overflow-hidden">
      {/* Background blobs */}
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
            Reset Password Request
          </h2>
          <p className="mt-2 text-center text-sm text-muted">
            The Name You Can Trust
          </p>
        </div>

        <div className="glass-login-card rounded-xl p-8">
          <h3 className="text-lg font-bold text-foreground font-display mb-6 border-b border-border pb-3 flex items-center gap-2">
            <KeyRound size={20} className="text-primary" /> Recover Account
          </h3>

          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border-l-4 border-destructive text-destructive text-xs rounded-r font-medium animate-slide-up">
              {error}
            </div>
          )}

          {submitted ? (
            <div className="space-y-6">
              <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 text-xs rounded-r font-medium leading-relaxed">
                If the email address <span className="font-bold">{email}</span> matches an active institutional account in our B2B registry, a password restoration link will be delivered within a few minutes. Please check your spam folder if you do not receive it.
              </div>
              <Link
                to="/login"
                className="w-full h-11 flex justify-center items-center gap-2 rounded-lg bg-primary hover:bg-primary/95 text-white text-xs font-bold transition-all shadow-md"
              >
                <ArrowLeft size={16} /> Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-xs text-muted leading-relaxed">
                Enter your registered B2B email address below and we will send you a secure recovery token to restore access.
              </p>

              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">
                  Institutional Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    required
                    id="nab_forgot_email_input"
                    name="nab_forgot_email_input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your institutional email"
                    autoComplete="off"
                    className="block w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Link
                  to="/login"
                  className="flex-1 h-11 flex items-center justify-center border border-border hover:bg-secondary text-foreground text-xs font-semibold rounded-lg transition-all"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] h-11 bg-primary hover:bg-primary/95 text-white text-xs font-bold rounded-lg transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : 'Send Reset Link'}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
