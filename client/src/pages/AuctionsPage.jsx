import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { Search, Filter, Zap, Award, Layers } from 'lucide-react';

export default function AuctionsPage({ onSelectAuction }) {
  const { socket } = useSocket();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ACTIVE'); // 'ACTIVE' | 'ENDED' | 'ALL'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('endingSoon'); // 'endingSoon' | 'priceHigh' | 'priceLow' | 'bidsHigh'

  const categories = [
    'All',
    'Luxury Watches',
    'Classic Cars',
    'Collectibles',
    'Cameras & Optics',
    'Tech & Hardware',
    'Fine Art',
  ];

  useEffect(() => {
    async function fetchAuctions() {
      try {
        setLoading(true);
        const res = await api.auctions.getAll();
        if (res.success) {
          setAuctions(res.auctions || []);
        }
      } catch (err) {
        console.error('Failed to fetch auctions:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAuctions();
  }, []);

  // Socket updates
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = (data) => {
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

    const handleEnded = (data) => {
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

    socket.on('auction:live_update', handleUpdate);
    socket.on('auction:status_changed', handleEnded);

    return () => {
      socket.off('auction:live_update', handleUpdate);
      socket.off('auction:status_changed', handleEnded);
    };
  }, [socket]);

  // Filtering & Sorting
  const filtered = auctions.filter((a) => {
    const matchesTab =
      activeTab === 'ALL'
        ? true
        : a.status === activeTab;
    const matchesCat = selectedCategory === 'All' || a.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesCat && matchesSearch;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'endingSoon') {
      return new Date(a.endTime).getTime() - new Date(b.endTime).getTime();
    }
    if (sortBy === 'priceHigh') {
      return (b.currentBid || 0) - (a.currentBid || 0);
    }
    if (sortBy === 'priceLow') {
      return (a.currentBid || 0) - (b.currentBid || 0);
    }
    if (sortBy === 'bidsHigh') {
      return (b.bidCount || 0) - (a.bidCount || 0);
    }
    return 0;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-100">
          Auction Marketplace
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Explore all active live lots, upcoming drops, and completed auctions.
        </p>

        {/* Status Tabs */}
        <div className="flex items-center gap-2 mt-6">
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'ACTIVE'
                ? 'bg-amber-500 text-dark-950 shadow-md shadow-amber-500/20'
                : 'bg-dark-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Live Now ({auctions.filter((a) => a.status === 'ACTIVE').length})
          </button>

          <button
            onClick={() => setActiveTab('ENDED')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'ENDED'
                ? 'bg-amber-500 text-dark-950 shadow-md shadow-amber-500/20'
                : 'bg-dark-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Completed Lots ({auctions.filter((a) => a.status === 'ENDED').length})
          </button>

          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'ALL'
                ? 'bg-amber-500 text-dark-950 shadow-md shadow-amber-500/20'
                : 'bg-dark-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            All Lots ({auctions.length})
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                  : 'bg-dark-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search & Sort */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-dark-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-dark-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
          >
            <option value="endingSoon">Time: Ending Soonest</option>
            <option value="priceHigh">Price: High to Low</option>
            <option value="priceLow">Price: Low to High</option>
            <option value="bidsHigh">Most Active (Bids)</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="rounded-2xl bg-dark-900 border border-slate-800 h-96 animate-pulse" />
          ))}
        </div>
      ) : sorted.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sorted.map((auction) => (
            <ProductCard
              key={auction._id}
              auction={auction}
              onSelect={onSelectAuction}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 rounded-2xl glass-panel border border-dashed border-slate-800">
          <p className="text-slate-400 text-sm">No auctions found matching your filters.</p>
        </div>
      )}
    </div>
  );
}
