import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import confetti from 'canvas-confetti';
import { Award, CheckCircle, ExternalLink, Sparkles, TrendingUp, DollarSign } from 'lucide-react';

export default function WinnerPage({ onSelectAuction }) {
  const [completedAuctions, setCompletedAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWinners() {
      try {
        setLoading(true);
        const res = await api.auctions.getAll({ status: 'ENDED' });
        if (res.success) {
          setCompletedAuctions(res.auctions || []);
        }
      } catch (err) {
        console.error('Failed to load completed auctions:', err);
      } finally {
        setLoading(false);
      }
    }
    loadWinners();

    // Fire celebratory confetti on mount
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.5 },
      colors: ['#f59e0b', '#10b981', '#3b82f6', '#f43f5e'],
    });
  }, []);

  const totalWonValue = completedAuctions.reduce(
    (acc, a) => acc + (a.winningBid || a.currentBid || 0),
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-fade-in">
      {/* Banner */}
      <div className="relative rounded-3xl p-8 sm:p-12 overflow-hidden glass-card-amber border-2 border-amber-500/40 text-center space-y-4 shadow-2xl">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500 text-dark-950 font-black shadow-xl shadow-amber-500/30">
          <Award className="w-9 h-9" />
        </div>

        <h1 className="font-display font-black text-3xl sm:text-5xl text-slate-100 tracking-tight">
          Hall of Winners & Finalized Lots
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Celebrating winning collectors and finalized bids. Every auction outcome is permanently anchored on the immutable platform record.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-8 pt-4 border-t border-amber-500/20 text-xs">
          <div>
            <span className="text-slate-400 block">Total Completed Lots</span>
            <span className="text-2xl font-black font-mono-numbers text-slate-100">
              {completedAuctions.length}
            </span>
          </div>
          <div className="w-px h-8 bg-slate-800 hidden sm:block" />
          <div>
            <span className="text-slate-400 block">Total Cleared Volume</span>
            <span className="text-2xl font-black font-mono-numbers text-amber-400">
              ${totalWonValue.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Won Lots */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="rounded-2xl bg-dark-900 border border-slate-800 h-80 animate-pulse" />
          ))}
        </div>
      ) : completedAuctions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {completedAuctions.map((auc) => (
            <div
              key={auc._id}
              onClick={() => onSelectAuction && onSelectAuction(auc._id)}
              className="group rounded-2xl glass-panel p-5 border border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Image */}
                <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-dark-900 mb-4">
                  <img
                    src={auc.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-md bg-dark-950/80 border border-slate-700 text-[10px] text-slate-300 backdrop-blur-md">
                    {auc.category}
                  </div>
                  <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-[11px] font-bold flex items-center gap-1 backdrop-blur-md">
                    <CheckCircle className="w-3.5 h-3.5" /> AUCTION CONCLUDED
                  </div>
                </div>

                <h3 className="font-display font-bold text-lg text-slate-100 group-hover:text-amber-400 transition-colors line-clamp-1">
                  {auc.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                  {auc.description}
                </p>
              </div>

              {/* Winner Profile Box */}
              <div className="p-4 rounded-xl bg-dark-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Winning Collector:</span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {auc.bidCount} bids placed
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={auc.winner?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                      alt=""
                      className="w-7 h-7 rounded-full object-cover border border-amber-500/50"
                    />
                    <div className="text-left">
                      <div className="text-xs font-bold text-slate-200">
                        {auc.winner?.name || 'Top Bidder'}
                      </div>
                      <div className="text-[10px] text-amber-400 font-medium">Declared Winner</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-black font-mono-numbers text-amber-400">
                      ${(auc.winningBid || auc.currentBid).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <button className="w-full py-2 px-3 rounded-lg bg-dark-850 hover:bg-dark-800 border border-slate-700 text-xs font-semibold text-slate-300 flex items-center justify-center gap-1.5 transition-colors">
                <ExternalLink className="w-3.5 h-3.5" />
                View Certified Audit Record
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 rounded-2xl glass-panel border border-dashed border-slate-800">
          <Award className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No auctions have concluded yet.</p>
        </div>
      )}
    </div>
  );
}
