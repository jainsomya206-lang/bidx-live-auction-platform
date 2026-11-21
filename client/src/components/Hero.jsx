import React from 'react';
import { Gavel, Shield, Zap, TrendingUp, Sparkles, Clock } from 'lucide-react';

export default function Hero({ onExplore, onAdmin, stats }) {
  return (
    <section className="relative overflow-hidden pt-12 pb-16 lg:pt-16 lg:pb-24 border-b border-slate-800/60">
      {/* Background glowing gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -top-32 right-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        {/* Top Feature Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel border-amber-500/30 text-amber-300 text-xs font-semibold mb-6 shadow-md animate-fade-in">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Real-Time High-Stakes Auction Marketplace</span>
          <span className="w-1 h-1 rounded-full bg-amber-400"></span>
          <span className="text-slate-400 font-normal">Zero Latency Bidding</span>
        </div>

        {/* Hero Title */}
        <h1 className="font-display font-black text-4xl sm:text-6xl lg:text-7xl text-slate-100 tracking-tight max-w-4xl mx-auto leading-[1.1]">
          Bid in <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200 bg-clip-text text-transparent">Real-Time.</span>
          <br />
          Claim the Extraordinary.
        </h1>

        {/* Hero Subtitle */}
        <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Experience live bidding with millisecond WebSocket synchronization, atomic anti-concurrency locks, and automatic 30-second anti-sniping protection.
        </p>

        {/* Call to Actions */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onExplore}
            className="px-8 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-400 text-dark-950 hover:from-amber-400 hover:to-amber-300 transition-all shadow-xl shadow-amber-500/25 flex items-center gap-2 transform hover:-translate-y-0.5"
          >
            <Gavel className="w-4 h-4" />
            Explore Live Auctions
          </button>
          <button
            onClick={onAdmin}
            className="px-7 py-3.5 rounded-xl font-semibold text-sm bg-dark-850 hover:bg-dark-800 text-slate-200 border border-slate-700/80 transition-all hover:border-amber-500/40 flex items-center gap-2"
          >
            <Shield className="w-4 h-4 text-amber-400" />
            Host / Admin Console
          </button>
        </div>

        {/* Key Features Banner */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="p-4 rounded-xl glass-panel border-slate-800 text-left">
            <div className="flex items-center gap-2 text-amber-400 mb-1">
              <Zap className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">WebSocket</span>
            </div>
            <div className="text-sm font-semibold text-slate-200">Instant Broadcast</div>
            <div className="text-xs text-slate-400 mt-0.5">Sub-50ms price sync</div>
          </div>

          <div className="p-4 rounded-xl glass-panel border-slate-800 text-left">
            <div className="flex items-center gap-2 text-rose-400 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Snipe Shield</span>
            </div>
            <div className="text-sm font-semibold text-slate-200">+30s Auto Extension</div>
            <div className="text-xs text-slate-400 mt-0.5">Fair play in final 30s</div>
          </div>

          <div className="p-4 rounded-xl glass-panel border-slate-800 text-left">
            <div className="flex items-center gap-2 text-cyan-400 mb-1">
              <Shield className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Atomic Safety</span>
            </div>
            <div className="text-sm font-semibold text-slate-200">Race-Free Bidding</div>
            <div className="text-xs text-slate-400 mt-0.5">Guaranteed single winner</div>
          </div>

          <div className="p-4 rounded-xl glass-panel border-slate-800 text-left">
            <div className="flex items-center gap-2 text-emerald-400 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Platform Stats</span>
            </div>
            <div className="text-sm font-semibold text-slate-200">
              {stats?.activeCount || 6} Active Auctions
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              ${(stats?.totalVolume || 345000).toLocaleString()} volume
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
