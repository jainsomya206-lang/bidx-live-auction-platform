import React from 'react';
import { Gavel, TrendingUp, User, Award, ShieldAlert } from 'lucide-react';
import CountdownTimer from './CountdownTimer';

export default function ProductCard({ auction, onSelect }) {
  if (!auction) return null;

  const isLive = auction.status === 'ACTIVE';
  const hasEnded = auction.status === 'ENDED';
  const mainImage = auction.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';

  return (
    <div
      onClick={() => onSelect && onSelect(auction._id)}
      className="group relative flex flex-col rounded-2xl glass-panel glass-panel-hover overflow-hidden transition-all duration-300 cursor-pointer border border-slate-800/80 hover:border-amber-500/40"
    >
      {/* Image container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-dark-900">
        <img
          src={mainImage}
          alt={auction.title}
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
          }}
        />

        {/* Gradient shadow overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/20 to-transparent opacity-80" />

        {/* Status Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 shadow-lg backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 -ml-3.5"></span>
              LIVE AUCTION
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900/90 text-slate-300 border border-slate-700 backdrop-blur-md">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              COMPLETED
            </span>
          )}

          {auction.isExtended && isLive && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50 backdrop-blur-md">
              <ShieldAlert className="w-3 h-3 text-amber-400" /> +30s Snipe Guard
            </span>
          )}
        </div>

        {/* Top-Right Category Badge */}
        <div className="absolute top-3 right-3">
          <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-dark-900/80 text-slate-300 border border-slate-700/60 backdrop-blur-md">
            {auction.category || 'Luxury'}
          </span>
        </div>

        {/* Bottom Image Overlay: Countdown Timer */}
        <div className="absolute bottom-3 right-3 left-3 flex justify-between items-end">
          <div className="text-xs text-slate-300">
            {auction.bidCount > 0 ? (
              <span className="flex items-center gap-1 bg-dark-900/90 px-2 py-1 rounded-md border border-slate-800 text-[11px] font-mono-numbers">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                {auction.bidCount} {auction.bidCount === 1 ? 'bid' : 'bids'}
              </span>
            ) : (
              <span className="bg-dark-900/90 px-2 py-1 rounded-md border border-slate-800 text-[11px] text-slate-400">
                Opening Bid
              </span>
            )}
          </div>

          <div>
            <CountdownTimer
              endTime={auction.endTime}
              isExtended={auction.isExtended}
              compact={true}
            />
          </div>
        </div>
      </div>

      {/* Body content */}
      <div className="flex flex-col flex-grow p-5 space-y-4">
        <div>
          <h3 className="font-display font-semibold text-lg text-slate-100 group-hover:text-amber-400 transition-colors line-clamp-1">
            {auction.title}
          </h3>
          <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
            {auction.description}
          </p>
        </div>

        {/* Bid & High bidder preview */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between mt-auto">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              {isLive ? 'Current Highest Bid' : 'Winning Bid'}
            </div>
            <div className="text-xl font-bold font-mono-numbers text-amber-400">
              ${(auction.currentBid || auction.startingPrice || 0).toLocaleString()}
            </div>
          </div>

          <div className="text-right">
            <div className="text-[11px] text-slate-400">
              {isLive ? 'Leader' : 'Winner'}
            </div>
            <div className="flex items-center justify-end gap-1.5 text-xs text-slate-300 mt-0.5 max-w-[120px] truncate">
              {auction.currentHighestBidder ? (
                <>
                  <img
                    src={auction.currentHighestBidder.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                    alt="bidder"
                    className="w-4 h-4 rounded-full object-cover border border-amber-500/40"
                  />
                  <span className="truncate font-medium text-slate-200">
                    {auction.currentHighestBidder.name || 'Anonymous'}
                  </span>
                </>
              ) : auction.winner ? (
                <>
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span className="truncate font-medium text-amber-300">
                    {auction.winner.name}
                  </span>
                </>
              ) : (
                <span className="text-slate-500 italic text-[11px]">No bids yet</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onSelect) onSelect(auction._id);
          }}
          className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg ${
            isLive
              ? 'bg-amber-500 hover:bg-amber-400 text-dark-950 shadow-amber-500/20 hover:shadow-amber-500/40'
              : 'bg-dark-800 hover:bg-dark-750 text-slate-300 border border-slate-700'
          }`}
        >
          <Gavel className="w-4 h-4" />
          {isLive ? 'Enter Live Auction' : 'View Final Results'}
        </button>
      </div>
    </div>
  );
}
