import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import CountdownTimer from '../components/CountdownTimer';
import confetti from 'canvas-confetti';
import {
  Gavel,
  Clock,
  TrendingUp,
  ShieldAlert,
  ArrowLeft,
  Users,
  Award,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Sparkles,
  Zap,
} from 'lucide-react';

export default function AuctionDetailsPage({ auctionId, onBack, onOpenAuth }) {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const { socket, joinAuction, leaveAuction, placeBid } = useSocket();

  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bidFeedback, setBidFeedback] = useState(null); // { type: 'success'|'error', text }
  const [viewers, setViewers] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [newBidFlash, setNewBidFlash] = useState(false);

  const historyEndRef = useRef(null);

  // Fetch auction details
  useEffect(() => {
    async function loadAuction() {
      try {
        setLoading(true);
        setError('');
        const res = await api.auctions.getById(auctionId);
        if (res.success && res.auction) {
          setAuction(res.auction);
          setBids(res.bids || []);

          // Set default recommended bid amount
          const minInc = res.auction.minIncrement || 10;
          const nextMin = res.auction.bidCount > 0
            ? res.auction.currentBid + minInc
            : res.auction.startingPrice;
          setBidAmount(String(nextMin));
        } else {
          setError('Auction not found.');
        }
      } catch (err) {
        setError(err.message || 'Failed to load auction.');
      } finally {
        setLoading(false);
      }
    }

    if (auctionId) {
      loadAuction();
    }
  }, [auctionId]);

  // Join Socket room & listen for live events
  useEffect(() => {
    if (!socket || !auctionId) return;

    joinAuction(auctionId);

    // Handle viewers count
    const handleViewers = (data) => {
      if (data.auctionId === auctionId) {
        setViewers(data.viewers || 1);
      }
    };

    // Handle incoming real-time bid
    const handleBidPlaced = (data) => {
      if (data.auctionId === auctionId) {
        setAuction((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            currentBid: data.currentBid,
            bidCount: data.bidCount,
            currentHighestBidder: data.currentHighestBidder,
            endTime: data.endTime,
            isExtended: data.isExtended,
          };
        });

        if (data.bid) {
          setBids((prev) => [data.bid, ...prev]);
        }

        // Trigger visual pulse
        setNewBidFlash(true);
        setTimeout(() => setNewBidFlash(false), 1200);

        // Update suggested bid amount
        const minInc = auction?.minIncrement || 10;
        setBidAmount(String(data.currentBid + minInc));
      }
    };

    // Handle anti-snipe extension
    const handleAuctionExtended = (data) => {
      if (data.auctionId === auctionId) {
        setAuction((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            endTime: data.newEndTime,
            isExtended: true,
          };
        });

        setBidFeedback({
          type: 'extension',
          text: data.message || '⚡ Snipe protection: Auction extended by 30 seconds!',
        });
      }
    };

    // Handle auction ending
    const handleAuctionEnded = (data) => {
      if (data.auctionId === auctionId) {
        setAuction((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            status: 'ENDED',
            winner: data.winner,
            winningBid: data.winningBid,
          };
        });

        // Trigger celebratory confetti if won
        if (data.hasWinner) {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#f59e0b', '#10b981', '#3b82f6', '#ffffff'],
          });
        }
      }
    };

    socket.on('auction:viewers', handleViewers);
    socket.on('bid:placed', handleBidPlaced);
    socket.on('auction:extended', handleAuctionExtended);
    socket.on('auction:ended', handleAuctionEnded);

    return () => {
      leaveAuction(auctionId);
      socket.off('auction:viewers', handleViewers);
      socket.off('bid:placed', handleBidPlaced);
      socket.off('auction:extended', handleAuctionExtended);
      socket.off('auction:ended', handleAuctionEnded);
    };
  }, [socket, auctionId, auction?.minIncrement]);

  // Handle Bid Submission
  const handlePlaceBid = async (e) => {
    if (e) e.preventDefault();
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    const numericAmount = Number(bidAmount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setBidFeedback({ type: 'error', text: 'Please enter a valid numeric amount.' });
      return;
    }

    setSubmitting(true);
    setBidFeedback(null);

    try {
      const res = await placeBid(auctionId, numericAmount);
      setBidFeedback({
        type: 'success',
        text: res.message || `Bid of $${numericAmount.toLocaleString()} submitted successfully!`,
      });

      // Refresh wallet balance
      if (refreshUser) refreshUser();

      // Trigger subtle mini confetti for user
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.7 },
      });
    } catch (err) {
      setBidFeedback({
        type: 'error',
        text: err.message || 'Failed to place bid. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickAdd = (increment) => {
    const current = Number(bidAmount) || auction?.currentBid || 0;
    setBidAmount(String(current + increment));
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="inline-block w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-400 mt-4">Connecting to live auction arena...</p>
      </div>
    );
  }

  if (error || !auction) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-100">{error || 'Auction not found'}</h2>
        <button
          onClick={onBack}
          className="mt-6 px-6 py-2.5 rounded-xl bg-dark-850 hover:bg-dark-800 text-slate-300 border border-slate-700 text-sm font-semibold inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Auctions
        </button>
      </div>
    );
  }

  const isLive = auction.status === 'ACTIVE';
  const hasEnded = auction.status === 'ENDED';
  const minInc = auction.minIncrement || 10;
  const minRequiredBid = auction.bidCount > 0
    ? auction.currentBid + minInc
    : auction.startingPrice;

  const isUserWinning = user && auction.currentHighestBidder?._id === user._id;
  const isUserWinner = hasEnded && user && auction.winner?._id === user._id;

  const imagesList = auction.images && auction.images.length > 0
    ? auction.images
    : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top back button & live room status bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors bg-dark-900 px-3.5 py-2 rounded-xl border border-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Auctions
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-900 border border-slate-800 text-xs text-slate-300">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono-numbers font-medium">{viewers}</span>
            <span className="text-slate-500">watching live</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-dark-900 border border-slate-800 text-xs">
            <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span className="font-semibold text-slate-200">
              {isLive ? 'LIVE ARENA' : 'FINALIZED'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Gallery on Left, Bidding Control on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: Visual Gallery & Specs (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Large Image Display */}
          <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-dark-900 border border-slate-800 shadow-2xl">
            <img
              src={imagesList[selectedImage] || imagesList[0]}
              alt={auction.title}
              className="w-full h-full object-cover object-center transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 via-transparent to-transparent pointer-events-none" />

            {/* Top badges */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-dark-950/80 text-amber-300 border border-amber-500/40 backdrop-blur-md">
                {auction.category}
              </span>
              {auction.isExtended && isLive && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-dark-950 shadow-lg flex items-center gap-1 animate-pulse">
                  <ShieldAlert className="w-3.5 h-3.5" /> +30s Anti-Snipe
                </span>
              )}
            </div>

            {/* Bottom title preview on mobile */}
            <div className="absolute bottom-4 left-4 right-4">
              <h1 className="font-display font-extrabold text-xl sm:text-2xl text-slate-100 drop-shadow-md">
                {auction.title}
              </h1>
            </div>
          </div>

          {/* Image Thumbnails if multiple */}
          {imagesList.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {imagesList.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`relative w-20 h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                    selectedImage === idx
                      ? 'border-amber-400 scale-105'
                      : 'border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={imgUrl} alt="thumb" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Description & Lot Specifications */}
          <div className="p-6 rounded-2xl glass-panel space-y-4">
            <h3 className="font-display font-bold text-lg text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Lot Description & Authenticity
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {auction.description}
            </p>

            <div className="pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block uppercase tracking-wider text-[10px]">Seller</span>
                <span className="text-slate-200 font-semibold">{auction.seller?.name || 'Verified Partner'}</span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase tracking-wider text-[10px]">Starting Bid</span>
                <span className="text-slate-200 font-semibold font-mono-numbers">
                  ${auction.startingPrice?.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase tracking-wider text-[10px]">Min. Increment</span>
                <span className="text-slate-200 font-semibold font-mono-numbers">
                  +${minInc?.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Live Bidding History Log */}
          <div className="p-6 rounded-2xl glass-panel space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Live Bidding Activity
              </h3>
              <span className="text-xs font-mono text-slate-400">
                {bids.length} total bids
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {bids.length > 0 ? (
                bids.map((b, idx) => (
                  <div
                    key={b._id || idx}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      idx === 0
                        ? 'bg-amber-500/10 border-amber-500/40 text-slate-100 shadow-md'
                        : 'bg-dark-900/60 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={b.bidder?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                        alt="bidder"
                        className="w-8 h-8 rounded-full object-cover border border-slate-700"
                      />
                      <div>
                        <div className="text-xs font-bold flex items-center gap-1.5">
                          <span>{b.bidder?.name || 'Anonymous Bidder'}</span>
                          {idx === 0 && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] uppercase font-bold bg-amber-400 text-dark-950">
                              Highest
                            </span>
                          )}
                          {b.wasExtensionTriggered && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] uppercase font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                              +30s Snipe
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(b.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold font-mono-numbers text-amber-400">
                        ${b.amount?.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {idx === bids.length - 1 ? 'Opening Bid' : `+$${(b.amount - (b.previousBid || 0)).toLocaleString()}`}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-slate-500 italic">
                  No bids placed yet. Be the first to start the auction!
                </div>
              )}
              <div ref={historyEndRef} />
            </div>
          </div>
        </div>

        {/* Right column: Live Bidding Console (5 cols) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          {/* Winner Celebration Card (If ended) */}
          {hasEnded && (
            <div className="p-6 rounded-2xl glass-card-amber border-2 border-amber-500/60 shadow-2xl space-y-4 text-center animate-fade-in">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500 text-dark-950 shadow-xl shadow-amber-500/30">
                <Award className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                  AUCTION CONCLUDED
                </span>
                <h3 className="text-2xl font-black text-slate-100 font-display mt-1">
                  {auction.winner ? `${auction.winner.name} Won!` : 'No Winner (Unsold)'}
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  {auction.winner
                    ? `Final Hammer Price: $${(auction.winningBid || auction.currentBid).toLocaleString()}`
                    : 'Auction concluded with zero bids.'}
                </p>
              </div>

              {isUserWinner && (
                <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-semibold">
                  🎉 Congratulations! You are the verified winner of this lot!
                </div>
              )}
            </div>
          )}

          {/* Live Countdown Timer Card */}
          <CountdownTimer
            endTime={auction.endTime}
            isExtended={auction.isExtended}
            onExpire={() => {
              // Server ticker will broadcast status change
            }}
          />

          {/* Current Bid Display Box */}
          <div className={`p-6 rounded-2xl glass-panel space-y-4 border transition-all ${
            newBidFlash ? 'border-amber-400 bg-amber-500/10 shadow-[0_0_30px_rgba(245,158,11,0.3)]' : 'border-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-semibold tracking-wider text-slate-400">
                {isLive ? 'Current Highest Bid' : 'Winning Bid'}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-dark-850 text-slate-300 border border-slate-700">
                {auction.bidCount} {auction.bidCount === 1 ? 'bid' : 'bids'} placed
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black font-mono-numbers text-amber-400 tracking-tight">
                ${(auction.currentBid || auction.startingPrice).toLocaleString()}
              </span>
              <span className="text-xs font-medium text-slate-500">USD</span>
            </div>

            {/* Current Leader */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Current Leader:</span>
              <div className="flex items-center gap-2">
                {auction.currentHighestBidder ? (
                  <>
                    <img
                      src={auction.currentHighestBidder.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                      alt="avatar"
                      className="w-5 h-5 rounded-full object-cover border border-amber-500/50"
                    />
                    <span className="font-semibold text-slate-100">
                      {auction.currentHighestBidder.name}
                    </span>
                    {isUserWinning && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        You
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-slate-500 italic">No bids yet</span>
                )}
              </div>
            </div>

            {/* Anti-Snipe Notice */}
            <div className="p-3 rounded-xl bg-dark-900 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
              <Zap className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-200">Snipe Protection Active:</strong> Any bid submitted in the final 30 seconds automatically adds +30 seconds to the countdown clock.
              </span>
            </div>
          </div>

          {/* Live Bid Placement Form */}
          {isLive && (
            <div className="p-6 rounded-2xl glass-panel border border-amber-500/30 space-y-5">
              <div className="flex items-center justify-between">
                <h4 className="font-display font-bold text-base text-slate-100 flex items-center gap-2">
                  <Gavel className="w-4 h-4 text-amber-400" />
                  Place Live Bid
                </h4>
                <span className="text-[11px] text-slate-400">
                  Min. Required: <strong className="text-amber-400 font-mono-numbers">${minRequiredBid.toLocaleString()}</strong>
                </span>
              </div>

              {/* Quick Bid Pill Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[10, 50, 100, 500].map((inc) => (
                  <button
                    key={inc}
                    type="button"
                    onClick={() => handleQuickAdd(inc)}
                    className="py-1.5 px-2 rounded-lg bg-dark-850 hover:bg-dark-800 border border-slate-700/80 text-xs font-mono font-medium text-slate-300 hover:text-amber-400 hover:border-amber-500/40 transition-colors"
                  >
                    +${inc}
                  </button>
                ))}
              </div>

              {/* Bid Feedback Toast / Alert */}
              {bidFeedback && (
                <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  bidFeedback.type === 'error'
                    ? 'bg-rose-950/80 border border-rose-800 text-rose-300'
                    : bidFeedback.type === 'extension'
                    ? 'bg-amber-950/80 border border-amber-700 text-amber-300 animate-pulse'
                    : 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
                }`}>
                  {bidFeedback.type === 'error' ? (
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  )}
                  <span>{bidFeedback.text}</span>
                </div>
              )}

              {/* Form Input & Button */}
              <form onSubmit={handlePlaceBid} className="space-y-4">
                <div className="relative">
                  <div className="absolute left-3.5 top-3 text-slate-400 font-bold text-base">
                    $
                  </div>
                  <input
                    type="number"
                    min={minRequiredBid}
                    step="1"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder={String(minRequiredBid)}
                    className="w-full pl-8 pr-4 py-3 bg-dark-900 border border-slate-700 rounded-xl text-lg font-bold font-mono-numbers text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {isAuthenticated ? (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-dark-950 hover:from-amber-400 hover:to-yellow-300 transition-all shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transform active:scale-98 disabled:opacity-50"
                  >
                    {submitting ? (
                      <span className="inline-block w-5 h-5 border-2 border-dark-950 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <Gavel className="w-4 h-4" />
                        <span>Place Bid of ${Number(bidAmount || minRequiredBid).toLocaleString()}</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenAuth}
                    className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-amber-500 text-dark-950 hover:bg-amber-400 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <span>Sign In to Place Bid</span>
                  </button>
                )}
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
