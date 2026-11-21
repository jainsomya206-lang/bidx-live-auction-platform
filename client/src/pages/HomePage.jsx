import React, { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import ProductCard from '../components/ProductCard';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { Search, Flame, Award, Filter, Sparkles, ArrowRight } from 'lucide-react';

export default function HomePage({ onSelectAuction, onExploreAll, onGoToAdmin, onGoToWinners }) {
  const { socket } = useSocket();
  const [auctions, setAuctions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = [
    'All',
    'Luxury Watches',
    'Classic Cars',
    'Collectibles',
    'Cameras & Optics',
    'Tech & Hardware',
    'Fine Art',
  ];

  // Fetch initial auctions and stats
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [auctionRes, statsRes] = await Promise.all([
          api.auctions.getAll(),
          api.auctions.getStats(),
        ]);

        if (auctionRes.success) {
          setAuctions(auctionRes.auctions || []);
        }
        if (statsRes.success) {
          setStats(statsRes.stats);
        }
      } catch (err) {
        console.error('Error loading home data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Listen for real-time live updates from Socket.IO to update prices and status seamlessly!
  useEffect(() => {
    if (!socket) return;

    const handleLiveUpdate = (data) => {
      setAuctions((prev) =>
        prev.map((auc) => {
          if (auc._id.toString() === data.auctionId) {
            return {
              ...auc,
              currentBid: data.currentBid,
              bidCount: data.bidCount,
              currentHighestBidder: data.currentHighestBidder,
              endTime: data.endTime,
              isExtended: data.isExtended,
            };
          }
          return auc;
        })
      );
    };

    const handleAuctionEnded = (data) => {
      setAuctions((prev) =>
        prev.map((auc) => {
          if (auc._id.toString() === data.auctionId) {
            return {
              ...auc,
              status: 'ENDED',
              winner: data.winner,
              winningBid: data.winningBid,
            };
          }
          return auc;
        })
      );
    };

    const handleAuctionCreated = (newAuction) => {
      setAuctions((prev) => [newAuction, ...prev]);
    };

    socket.on('auction:live_update', handleLiveUpdate);
    socket.on('auction:status_changed', handleAuctionEnded);
    socket.on('auction:created', handleAuctionCreated);

    return () => {
      socket.off('auction:live_update', handleLiveUpdate);
      socket.off('auction:status_changed', handleAuctionEnded);
      socket.off('auction:created', handleAuctionCreated);
    };
  }, [socket]);

  // Filter live and completed auctions
  const liveAuctions = auctions.filter((a) => a.status === 'ACTIVE');
  const endedAuctions = auctions.filter((a) => a.status === 'ENDED');

  const filteredLive = liveAuctions.filter((a) => {
    const matchesCategory = selectedCategory === 'All' || a.category === selectedCategory;
    const matchesSearch =
      searchTerm === '' ||
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Header */}
      <Hero
        onExplore={onExploreAll}
        onAdmin={onGoToAdmin}
        stats={stats}
      />

      {/* Main Live Auctions Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Header & Filters */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              Real-Time Bidding Arena
            </div>
            <h2 className="font-display text-3xl font-bold text-slate-100">
              Featured Live Auctions
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Bid in real-time. Highest valid bid when the clock strikes zero takes the prize.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search live lots..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-dark-900 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-dark-950 shadow-md shadow-amber-500/20'
                  : 'bg-dark-900 hover:bg-dark-850 text-slate-300 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Live Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="rounded-2xl bg-dark-900 border border-slate-800 h-96 animate-pulse" />
            ))}
          </div>
        ) : filteredLive.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLive.map((auction) => (
              <ProductCard
                key={auction._id}
                auction={auction}
                onSelect={onSelectAuction}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 rounded-2xl glass-panel border-dashed border-slate-800">
            <Flame className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-300">No active auctions matching criteria</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Try adjusting your search terms or view completed auctions in the Hall of Winners.
            </p>
          </div>
        )}

        {/* Hall of Winners Teaser */}
        {endedAuctions.length > 0 && (
          <div className="mt-16 p-8 rounded-2xl glass-card-amber border border-amber-500/30">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 mb-3">
                  <Award className="w-3.5 h-3.5 text-amber-400" /> Hall of Winners
                </span>
                <h3 className="font-display text-2xl font-bold text-slate-100">
                  Past Champions & Won Lots
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-lg">
                  Explore finalized auctions, winning bids, and confirmed collectors. Every completion is recorded on our immutable bid ledger.
                </p>
              </div>

              <button
                onClick={onGoToWinners}
                className="px-6 py-3 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-dark-950 transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 whitespace-nowrap"
              >
                <span>View All Winners ({endedAuctions.length})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
