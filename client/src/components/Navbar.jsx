import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  Gavel,
  Zap,
  Award,
  PlusCircle,
  LogOut,
  User,
  Menu,
  X,
  Wallet,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export default function Navbar({ activePage, setActivePage, onOpenAuth }) {
  const { user, isAuthenticated, isAdmin, logout, demoUsers, quickDemoLogin } = useAuth();
  const { isConnected } = useSocket();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoDropdownOpen, setDemoDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-dark-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-8">
          <button
            onClick={() => setActivePage('home')}
            className="flex items-center gap-2.5 group focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-dark-950 font-black shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Gavel className="w-5 h-5 -rotate-12 group-hover:rotate-0 transition-transform" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-display font-black text-2xl tracking-tight text-white flex items-center gap-1">
                Bid<span className="text-amber-400">X</span>
              </span>
              <span className="text-[10px] tracking-widest font-mono uppercase text-slate-400 -mt-1">
                Live Auctions
              </span>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActivePage('home')}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                activePage === 'home'
                  ? 'bg-dark-850 text-amber-400 border border-amber-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-dark-900'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setActivePage('auctions')}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                activePage === 'auctions'
                  ? 'bg-dark-850 text-amber-400 border border-amber-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-dark-900'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-400" />
              Live Auctions
            </button>
            <button
              onClick={() => setActivePage('winners')}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                activePage === 'winners'
                  ? 'bg-dark-850 text-amber-400 border border-amber-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-dark-900'
              }`}
            >
              <Award className="w-4 h-4 text-amber-400" />
              Winners
            </button>
            {isAdmin && (
              <button
                onClick={() => setActivePage('admin')}
                className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                  activePage === 'admin'
                    ? 'bg-dark-850 text-amber-400 border border-amber-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-dark-900'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Admin Dashboard
              </button>
            )}
          </nav>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* Socket Gateway Connectivity indicator */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-900 border border-slate-800 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="font-mono text-[11px] text-slate-300">
              {isConnected ? 'Gateway Live' : 'Connecting...'}
            </span>
          </div>

          {/* Quick Demo Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDemoDropdownOpen(!demoDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-850 hover:bg-dark-800 border border-amber-500/20 text-xs font-medium text-amber-300 transition-colors"
              title="Switch Demo Accounts"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Demo Switcher</span>
            </button>

            {demoDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-dark-900 border border-slate-700 shadow-2xl py-2 z-50">
                <div className="px-3 py-1.5 text-[11px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800">
                  Switch Active Bidder
                </div>
                {demoUsers.map((d) => (
                  <button
                    key={d.email}
                    onClick={() => {
                      quickDemoLogin(d);
                      setDemoDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-dark-800 transition-colors ${
                      user?.email === d.email ? 'text-amber-400 font-semibold' : 'text-slate-300'
                    }`}
                  >
                    <div>
                      <div>{d.name}</div>
                      <div className="text-[10px] text-slate-500">{d.role === 'admin' ? 'Platform Admin' : d.label}</div>
                    </div>
                    {user?.email === d.email && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User authentication block */}
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {/* Virtual Wallet Balance */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-850 border border-slate-800 text-xs">
                <Wallet className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-400 font-medium">Balance:</span>
                <span className="font-mono-numbers font-bold text-slate-100">
                  ${(user.balance || 0).toLocaleString()}
                </span>
              </div>

              {/* User Avatar + Name */}
              <div className="flex items-center gap-2 pl-1">
                <img
                  src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover border border-amber-500/40"
                />
                <div className="hidden md:block text-left">
                  <div className="text-xs font-semibold text-slate-200 leading-tight">
                    {user.name}
                  </div>
                  <div className="text-[10px] text-slate-400 capitalize">
                    {user.role}
                  </div>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={logout}
                title="Sign Out"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-dark-850 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-400 text-dark-950 transition-all shadow-md shadow-amber-500/20"
            >
              Sign In / Register
            </button>
          )}

          {/* Mobile menu hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-dark-900 border-b border-slate-800 px-4 py-3 space-y-2">
          <button
            onClick={() => { setActivePage('home'); setMobileMenuOpen(false); }}
            className="w-full text-left py-2 px-3 rounded-lg text-sm text-slate-200 font-medium"
          >
            Home
          </button>
          <button
            onClick={() => { setActivePage('auctions'); setMobileMenuOpen(false); }}
            className="w-full text-left py-2 px-3 rounded-lg text-sm text-slate-200 font-medium"
          >
            Live Auctions
          </button>
          <button
            onClick={() => { setActivePage('winners'); setMobileMenuOpen(false); }}
            className="w-full text-left py-2 px-3 rounded-lg text-sm text-slate-200 font-medium"
          >
            Winners
          </button>
          {isAdmin && (
            <button
              onClick={() => { setActivePage('admin'); setMobileMenuOpen(false); }}
              className="w-full text-left py-2 px-3 rounded-lg text-sm text-amber-400 font-medium"
            >
              Admin Dashboard
            </button>
          )}
        </div>
      )}
    </header>
  );
}
