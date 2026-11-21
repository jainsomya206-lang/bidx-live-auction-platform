import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User, Shield, CheckCircle, ArrowRight } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
  const { login, register, quickDemoLogin, demoUsers } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register(formData.name, formData.email, formData.password, formData.role);
      } else {
        await login(formData.email, formData.password);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = async (demoUser) => {
    setError('');
    setLoading(true);
    try {
      await quickDemoLogin(demoUser);
      onClose();
    } catch (err) {
      setError('Failed to log in with demo account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl glass-panel bg-dark-900 border border-slate-700/80 shadow-2xl p-6 sm:p-8 overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 transition-colors p-1 rounded-lg hover:bg-dark-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-dark-950 font-bold mb-3 shadow-lg shadow-amber-500/20">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-100">
            {isRegister ? 'Join the BidX Arena' : 'Welcome to BidX'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isRegister
              ? 'Create your collector account and start bidding live'
              : 'Sign in to place live bids and track high-stakes auctions'}
          </p>
        </div>

        {/* 1-Click Demo Accounts Quick-Switch Bar */}
        <div className="mb-6 p-3.5 rounded-xl bg-dark-850 border border-amber-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1">
              ⚡ 1-Click Demo Logins
            </span>
            <span className="text-[10px] text-slate-400">Ready to test</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {demoUsers.map((d) => (
              <button
                key={d.email}
                type="button"
                onClick={() => handleDemoSelect(d)}
                disabled={loading}
                className="flex flex-col text-left p-2 rounded-lg bg-dark-800/80 hover:bg-amber-500/10 border border-slate-700/60 hover:border-amber-500/40 transition-all text-xs group"
              >
                <div className="font-semibold text-slate-200 group-hover:text-amber-400 truncate">
                  {d.name}
                </div>
                <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                  {d.role === 'admin' ? (
                    <span className="text-amber-400 font-medium">★ Admin</span>
                  ) : (
                    <span>{d.label}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tabs switcher */}
        <div className="flex rounded-lg bg-dark-850 p-1 mb-5 border border-slate-800">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(''); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
              !isRegister ? 'bg-amber-500 text-dark-950 shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(''); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
              isRegister ? 'bg-amber-500 text-dark-950 shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/70 border border-rose-800 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. John Wick"
                  className="w-full pl-9 pr-3 py-2 bg-dark-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="collector@bidx.io"
                className="w-full pl-9 pr-3 py-2 bg-dark-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-dark-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Account Role</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'user' })}
                  className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all ${
                    formData.role === 'user'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-dark-800 border-slate-700 text-slate-400'
                  }`}
                >
                  Collector / Bidder
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'admin' })}
                  className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all ${
                    formData.role === 'admin'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-dark-800 border-slate-700 text-slate-400'
                  }`}
                >
                  Admin / Host
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-400 text-dark-950 hover:from-amber-400 hover:to-amber-300 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-dark-950 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span>{isRegister ? 'Complete Registration' : 'Enter Auction Arena'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
