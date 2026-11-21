import React from 'react';
import { Gavel, Heart, Shield, Cpu, Clock } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-dark-950 py-12 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-dark-950 font-bold">
              <Gavel className="w-4 h-4" />
            </div>
            <div>
              <span className="font-display font-bold text-base text-slate-100 tracking-tight">
                Bid<span className="text-amber-400">X</span>
              </span>
              <p className="text-slate-500 text-[11px]">Real-Time Live Auction Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-slate-400">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-amber-400" /> Socket.IO Real-Time Engine
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" /> 30s Snipe Guard
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-400" /> Atomic Bidding
            </span>
          </div>

          <div className="text-center md:text-right text-slate-500">
            &copy; {new Date().getFullYear()} BidX Platform. Built for real-time live trading.
          </div>
        </div>
      </div>
    </footer>
  );
}
